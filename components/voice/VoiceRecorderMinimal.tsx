"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, X, Loader2, Play, Pause, RefreshCw, Send } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Language } from "@/lib/utils/language";

interface VoiceRecorderMinimalProps {
  onTranscript: (text: string) => void;
  language: Language;
  disabled?: boolean;
}

export function VoiceRecorderMinimal({ onTranscript, language, disabled = false }: VoiceRecorderMinimalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const isArabic = language === "ar";

  const startRecording = useCallback(async () => {
    try {
      audioChunksRef.current = [];
      setRecordedAudio(null);
      setAudioUrl(null);
      setTranscribedText("");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 0) {
          setRecordedAudio(audioBlob);
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          setShowPreview(true);
          await processAudio(audioBlob);
        }
        cleanup();
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Simple haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
    } catch (err: any) {
      console.error("Mic error:", err);
      cleanup();
    }
  }, [language]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    audioChunksRef.current = [];
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    setShowPreview(false);
    setRecordedAudio(null);
    setAudioUrl(null);
    cleanup();
  }, [isRecording]);

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("language", language);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/voice/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.text && data.text.trim()) {
        setTranscribedText(data.text.trim());
      }
    } catch (err) {
      console.error("Transcription error:", err);
      // Don't show error, just allow retry
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioUrl) return;

    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
      } else {
        audioElementRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSendTranscript = () => {
    if (transcribedText) {
      onTranscript(transcribedText);
      setShowPreview(false);
      setRecordedAudio(null);
      setAudioUrl(null);
      setTranscribedText("");
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      cleanup();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  return (
    <>
      {/* Main Record Button - Minimal Design */}
      {!showPreview && (
        <button
          onMouseDown={() => !disabled && !isProcessing && startRecording()}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={() => !disabled && !isProcessing && startRecording()}
          onTouchEnd={stopRecording}
          disabled={disabled || isProcessing}
          className={cn(
            "p-3 rounded-full transition-all duration-200",
            isRecording ? "bg-red-500 scale-110" :
            isProcessing ? "bg-gray-300" :
            "bg-teal-600 hover:bg-teal-700",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Mic className="w-5 h-5 text-white" />
          )}
        </button>
      )}

      {/* Minimal Recording Modal */}
      {isRecording && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4">
            {/* Close button */}
            <button
              onClick={cancelRecording}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Recording indicator */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <Mic className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="text-2xl font-mono mb-2">{formatTime(recordingTime)}</div>

              <p className="text-sm text-gray-500">
                {isArabic ? "جاري التسجيل..." : "Enregistrement..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Preview Modal */}
      {showPreview && audioUrl && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            {/* Playback controls */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={handlePlayPause}
                className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                disabled={isProcessing}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-gray-700" />
                ) : (
                  <Play className="w-5 h-5 text-gray-700" />
                )}
              </button>
            </div>

            {/* Transcribed text or processing */}
            {isProcessing ? (
              <div className="text-center py-4">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">
                  {isArabic ? "جاري التحويل..." : "Transcription..."}
                </p>
              </div>
            ) : transcribedText ? (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700">{transcribedText}</p>
              </div>
            ) : null}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  cancelRecording();
                  startRecording();
                }}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">{isArabic ? "إعادة" : "Refaire"}</span>
              </button>

              <button
                onClick={cancelRecording}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                <span className="text-sm">{isArabic ? "إلغاء" : "Annuler"}</span>
              </button>

              <button
                onClick={handleSendTranscript}
                disabled={!transcribedText || isProcessing}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2",
                  transcribedText && !isProcessing ?
                    "bg-teal-600 hover:bg-teal-700 text-white" :
                    "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
                <span className="text-sm">{isArabic ? "إرسال" : "Envoyer"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}