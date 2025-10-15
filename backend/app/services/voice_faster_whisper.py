"""
Free/open-source speech-to-text using Faster-Whisper.

This module provides a drop-in replacement for the paid OpenAI Whisper API
by running the lighter Faster-Whisper model locally. It keeps the async
signature expected by the rest of the codebase while offloading the CPU work
to a background thread.
"""

from __future__ import annotations

import asyncio
import os
import tempfile
from typing import Optional, Tuple
from threading import Lock

from faster_whisper import WhisperModel
from loguru import logger

from app.core.config import settings

# Global model singleton guarded by a lock to avoid duplicate loads.
_model: Optional[WhisperModel] = None
_model_lock: Lock = Lock()


def _resolve_language_hint(language: Optional[str]) -> Optional[str]:
    """Return ISO language hint or None to let the model auto-detect."""
    if not language:
        return None

    normalized = language.lower()

    # Let Faster-Whisper auto-detect Arabic dialects for better Darija support.
    if normalized.startswith("ar"):
        return None

    if normalized.startswith("fr"):
        return "fr"

    return None


def _load_model() -> WhisperModel:
    """Load (or reuse) the Faster-Whisper model."""
    global _model

    if _model is not None:
        return _model

    with _model_lock:
        if _model is not None:
            return _model

        model_size_or_path = os.getenv("VOICE_STT_MODEL_PATH") or settings.VOICE_STT_MODEL_SIZE
        logger.info(
            "Loading Faster-Whisper model (%s) on %s [%s]",
            model_size_or_path,
            settings.VOICE_STT_DEVICE,
            settings.VOICE_STT_COMPUTE_TYPE,
        )

        _model = WhisperModel(
            model_size_or_path,
            device=settings.VOICE_STT_DEVICE,
            compute_type=settings.VOICE_STT_COMPUTE_TYPE,
        )

    return _model


def _write_temp_audio_file(audio_data: bytes, suffix: str = ".webm") -> str:
    """Persist the uploaded audio blob to a temporary file."""
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    tmp.write(audio_data)
    tmp.flush()
    tmp.close()
    return tmp.name


def _transcribe_sync(audio_data: bytes, language: Optional[str]) -> Tuple[str, float]:
    """CPU-bound transcription executed inside a worker thread."""
    model = _load_model()

    temp_path = _write_temp_audio_file(audio_data)

    try:
        language_hint = _resolve_language_hint(language)
        segments, info = model.transcribe(
            temp_path,
            language=language_hint,
            beam_size=5,
            vad_filter=True,
        )

        transcript_parts = [segment.text.strip() for segment in segments if segment.text]
        transcript = " ".join(transcript_parts).strip()

        if not transcript:
            return "", 0.0

        # Faster-Whisper does not expose per-token confidence; approximate with avg log prob.
        confidences = [
            max(0.0, min(1.0, 1 + (segment.avg_log_prob or -1) / 5))
            for segment in segments
            if segment.avg_log_prob is not None
        ]
        confidence = sum(confidences) / len(confidences) if confidences else 0.6

        logger.info(
            "Local transcription finished (language_hint=%s, detected=%s, confidence≈%.2f)",
            language_hint or "auto",
            info.language if info else "unknown",
            confidence,
        )

        return transcript, confidence
    finally:
        try:
            os.unlink(temp_path)
        except OSError:
            pass


async def transcribe_audio(audio_data: bytes, language: str = "ar") -> Tuple[str, float]:
    """Async wrapper that runs Faster-Whisper transcription in a thread."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _transcribe_sync, audio_data, language)


async def detect_language_from_audio(audio_data: bytes) -> str:
    """Detect spoken language using Faster-Whisper."""
    transcript, _ = await transcribe_audio(audio_data, language="auto")
    # Rough heuristic: if transcript includes Arabic letters, assume Arabic; else fallback to French.
    if any("\u0600" <= char <= "\u06FF" for char in transcript):
        return "ar"
    return "fr"


def clear_voice_cache():
    """Placeholder for compatibility with voice.py; no cache used here."""
    return None
