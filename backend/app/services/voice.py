"""
Voice services: Speech-to-Text and Text-to-Speech.

Speech-to-Text can run via a free/local Faster-Whisper model or the paid OpenAI API,
selected through VOICE_STT_PROVIDER. Text-to-Speech remains powered by OpenAI TTS-1-HD.
Google Cloud and Azure providers are deprecated.
"""

import asyncio
from typing import Tuple
from io import BytesIO
from loguru import logger

from app.core.config import settings

# Text-to-speech remains powered by OpenAI.
from app.services.voice_openai import (
    synthesize_speech as synthesize_speech_openai,
    get_available_voices,
    clear_voice_cache,
)

# Speech-to-text provider (free/local vs OpenAI) is selected via configuration.
STT_PROVIDER = settings.VOICE_STT_PROVIDER.lower()

if STT_PROVIDER == "openai":
    logger.info("Voice service configured to use OpenAI Whisper API for STT.")
    from app.services.voice_openai import (
        transcribe_audio as transcribe_audio_backend,
        detect_language_from_audio,
    )
else:
    logger.info("Voice service configured to use Faster-Whisper for free/local STT.")
    from app.services.voice_faster_whisper import (
        transcribe_audio as transcribe_audio_backend,
        detect_language_from_audio,
    )


async def transcribe_audio(audio_data: bytes, language: str = "ar") -> Tuple[str, float]:
    """
    Transcribe audio to text using the configured STT backend.

    Args:
        audio_data: Audio file bytes
        language: Target language (ar or fr)

    Returns:
        Tuple of (transcribed text, confidence score)
    """
    try:
        logger.info(
            "[Voice STT] Provider=%s, language=%s",
            STT_PROVIDER,
            language,
        )
        stt_future = transcribe_audio_backend(audio_data, language)

        if STT_PROVIDER != "openai":
            timeout = max(1, settings.VOICE_STT_TIMEOUT_SECONDS)
            try:
                text, confidence = await asyncio.wait_for(stt_future, timeout=timeout)
            except asyncio.TimeoutError:
                logger.warning(
                    "Local STT timed out after %ss; falling back to OpenAI Whisper.",
                    timeout,
                )
                raise
        else:
            text, confidence = await stt_future

        if not text.strip():
            raise ValueError("Empty transcription returned from STT provider")

        return text, confidence

    except Exception as e:
        logger.error(f"Transcription error: {e}")

        if STT_PROVIDER != "openai":
            logger.warning("Falling back to OpenAI Whisper due to STT failure.")
            from app.services.voice_openai import transcribe_audio as openai_transcribe

            return await openai_transcribe(audio_data, language)

        raise


async def synthesize_speech(
    text: str, language: str = "ar", voice: str = "female", speed: float = 1.0
) -> BytesIO:
    """
    Synthesize speech from text using OpenAI TTS-1-HD.

    This function now uses OpenAI TTS exclusively.
    Google Cloud Text-to-Speech is deprecated.

    Args:
        text: Text to synthesize
        language: Target language (ar or fr)
        voice: Voice profile (female/male/default/neutral)
        speed: Speech speed (0.25 to 4.0)

    Returns:
        Audio stream in MP3 format
    """
    try:
        logger.info(f"[OpenAI TTS] Synthesizing speech in {language}")

        # Map old voice parameter to new system
        voice_profile = voice if voice in ["default", "male", "female", "neutral"] else "default"

        return await synthesize_speech_openai(text, language, voice_profile, speed)

    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise


# Legacy function names (deprecated but maintained for compatibility)
async def transcribe_audio_google(audio_data: bytes, language: str = "ar") -> Tuple[str, float]:
    """
    DEPRECATED: Google Cloud Speech is no longer used.
    This function now redirects to OpenAI Whisper.
    """
    logger.warning(
        "transcribe_audio_google() is deprecated. "
        "Google Cloud Speech is no longer used. "
        "Using OpenAI Whisper instead."
    )
    return await transcribe_audio(audio_data, language)


async def synthesize_speech_google(
    text: str, language: str = "ar", voice: str = "female", speed: float = 1.0
) -> BytesIO:
    """
    DEPRECATED: Google Cloud TTS is no longer used.
    This function now redirects to OpenAI TTS.
    """
    logger.warning(
        "synthesize_speech_google() is deprecated. "
        "Google Cloud TTS is no longer used. "
        "Using OpenAI TTS-1-HD instead."
    )
    return await synthesize_speech(text, language, voice, speed)


# Azure alternatives (not implemented - OpenAI is preferred)
async def transcribe_audio_azure(
    audio_data: bytes, language: str = "ar"
) -> Tuple[str, float]:
    """
    Alternative transcription using Azure Speech Services.
    NOT IMPLEMENTED - OpenAI Whisper is the recommended solution.
    """
    logger.error("Azure Speech Services not implemented. Use OpenAI Whisper.")
    raise NotImplementedError("Azure Speech Services not implemented. Use OpenAI Whisper.")


async def synthesize_speech_azure(
    text: str, language: str = "ar", voice: str = "female", speed: float = 1.0
) -> BytesIO:
    """
    Alternative TTS using Azure Speech Services.
    NOT IMPLEMENTED - OpenAI TTS is the recommended solution.
    """
    logger.error("Azure Speech Services not implemented. Use OpenAI TTS.")
    raise NotImplementedError("Azure Speech Services not implemented. Use OpenAI TTS.")
