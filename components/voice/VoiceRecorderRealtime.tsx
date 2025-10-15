"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Loader2, Volume2, VolumeX, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Language } from "@/lib/utils/language";

interface VoiceRecorderRealtimeProps {
  onTranscript: (text: string) => void;
  language: Language;
  disabled?: boolean;
}

// Best practice audio configuration for Whisper
const AUDIO_CONFIG = {
  audio: {
    channelCount: 1,
    sampleRate: 16000, // Whisper's preferred sample rate
    sampleSize: 16,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  }
};

// Optimal chunk duration for real-time processing (milliseconds)
const CHUNK_DURATION = 1000; // 1 second chunks for better real-time feel

export function VoiceRecorderRealtime({ onTranscript, language, disabled = false }: VoiceRecorderRealtimeProps) {
  // State management
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for audio processing
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const processingQueueRef = useRef<Blob[]>([]);
  const isProcessingChunkRef = useRef(false);

  const isArabic = language === "ar";

  // Initialize audio context and stream
  const initializeAudio = useCallback(async () => {
    try {
      setError(null);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONFIG);
      streamRef.current = stream;

      // Setup Web Audio API for visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Setup MediaRecorder with optimal settings
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000 // Good quality for speech
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data availability
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          processingQueueRef.current.push(event.data);
          processNextChunk();
        }
      };

      setIsInitialized(true);
      return true;
    } catch (err) {
      console.error("Audio initialization error:", err);
      handleError(err);
      return false;
    }
  }, []);

  // Process audio chunks sequentially
  const processNextChunk = useCallback(async () => {
    if (isProcessingChunkRef.current || processingQueueRef.current.length === 0) {
      return;
    }

    isProcessingChunkRef.current = true;
    const chunk = processingQueueRef.current.shift()!;

    try {
      const formData = new FormData();
      formData.append("file", chunk, "audio.webm");
      formData.append("language", language);
      formData.append("prompt", "Transcribe this audio accurately"); // Improves accuracy

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/voice/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.text && data.text.trim()) {
          setInterimTranscript(data.text.trim());
          setTranscript(prev => prev ? `${prev} ${data.text.trim()}` : data.text.trim());
        }
      }
    } catch (err) {
      console.error("Chunk processing error:", err);
    } finally {
      isProcessingChunkRef.current = false;
      // Process next chunk if available
      if (processingQueueRef.current.length > 0) {
        processNextChunk();
      }
    }
  }, [language]);

  // Start listening
  const startListening = useCallback(async () => {
    if (!isInitialized) {
      const success = await initializeAudio();
      if (!success) return;
    }

    setTranscript("");
    setInterimTranscript("");
    setError(null);
    chunksRef.current = [];
    processingQueueRef.current = [];

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
      mediaRecorderRef.current.start(CHUNK_DURATION); // Start with chunk duration
      setIsListening(true);
      startVisualization();

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  }, [isInitialized, initializeAudio]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      stopVisualization();

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 30]);
      }

      // Process any remaining chunks
      if (processingQueueRef.current.length > 0) {
        setIsProcessing(true);
        Promise.all(processingQueueRef.current.map(() => processNextChunk()))
          .finally(() => setIsProcessing(false));
      }
    }
  }, [processNextChunk]);

  // Send transcript
  const sendTranscript = useCallback(() => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      setTranscript("");
      setInterimTranscript("");

      // Success feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 100, 50]);
      }
    }
  }, [transcript, onTranscript]);

  // Reset/Clear
  const reset = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    processingQueueRef.current = [];
  }, []);

  // Audio visualization
  const startVisualization = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }, []);

  const stopVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Error handling
  const handleError = (err: any) => {
    let errorMessage = isArabic ? "حدث خطأ" : "Une erreur s'est produite";

    if (err instanceof DOMException) {
      switch (err.name) {
        case "NotAllowedError":
          errorMessage = isArabic
            ? "يرجى السماح بالوصول إلى الميكروفون"
            : "Veuillez autoriser l'accès au microphone";
          break;
        case "NotFoundError":
          errorMessage = isArabic
            ? "لم يتم العثور على ميكروفون"
            : "Aucun microphone trouvé";
          break;
        default:
          errorMessage = isArabic
            ? "تعذر الوصول إلى الميكروفون"
            : "Impossible d'accéder au microphone";
      }
    }

    setError(errorMessage);
    setIsListening(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVisualization();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stopVisualization]);

  return (
    <div className="relative">
      {/* Main Voice Interface */}
      <div className="flex flex-col items-center space-y-4">

        {/* Voice Button with Visual Feedback */}
        <div className="relative">
          {/* Pulse animation when listening */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-25" />
              <div className="absolute inset-0 rounded-full bg-teal-300 animate-ping animation-delay-200 opacity-20" />
            </>
          )}

          {/* Main button */}
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={disabled || isProcessing}
            className={cn(
              "relative p-6 rounded-full transition-all duration-300",
              "shadow-lg hover:shadow-xl",
              isListening
                ? "bg-red-500 hover:bg-red-600 scale-110"
                : "bg-teal-500 hover:bg-teal-600",
              disabled && "opacity-50 cursor-not-allowed",
              "transform active:scale-95"
            )}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}

            {/* Audio level indicator */}
            {isListening && (
              <div
                className="absolute inset-0 rounded-full border-4 border-white opacity-50"
                style={{
                  transform: `scale(${1 + audioLevel * 0.3})`,
                  transition: 'transform 100ms ease-out'
                }}
              />
            )}
          </button>
        </div>

        {/* Status Text */}
        <div className="text-center">
          {isListening ? (
            <p className="text-sm font-medium text-gray-700 animate-pulse">
              {isArabic ? "جاري الاستماع..." : "Écoute en cours..."}
            </p>
          ) : transcript ? (
            <p className="text-sm font-medium text-green-600">
              {isArabic ? "جاهز للإرسال" : "Prêt à envoyer"}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              {isArabic ? "اضغط للتحدث" : "Appuyez pour parler"}
            </p>
          )}
        </div>

        {/* Real-time Transcript Display */}
        {(transcript || interimTranscript) && (
          <div className="w-full max-w-md">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              {/* Final transcript */}
              {transcript && (
                <p className="text-gray-800 mb-2">{transcript}</p>
              )}

              {/* Interim transcript (real-time) */}
              {interimTranscript && (
                <p className="text-gray-400 italic">
                  {interimTranscript}
                  <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={reset}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm">{isArabic ? "مسح" : "Effacer"}</span>
              </button>

              <button
                onClick={sendTranscript}
                disabled={!transcript.trim()}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2",
                  transcript.trim()
                    ? "bg-teal-500 hover:bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">{isArabic ? "إرسال" : "Envoyer"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">
              {isArabic ? "معالجة..." : "Traitement..."}
            </span>
          </div>
        )}

        {/* Voice Activity Bars */}
        {isListening && (
          <div className="flex items-center gap-1 h-8">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-teal-400 rounded-full transition-all duration-100"
                style={{
                  height: `${Math.max(4, Math.sin((audioLevel * 10 + i) * 0.5) * 32)}px`,
                  opacity: 0.5 + audioLevel * 0.5
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}