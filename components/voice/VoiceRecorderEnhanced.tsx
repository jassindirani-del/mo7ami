"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, X, ChevronUp, Loader2, Play, Pause, RotateCcw, Send, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Language } from "@/lib/utils/language";

interface VoiceRecorderEnhancedProps {
  onTranscript: (text: string) => void;
  language: Language;
  disabled?: boolean;
}

export function VoiceRecorderEnhanced({ onTranscript, language, disabled = false }: VoiceRecorderEnhancedProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [slideOffset, setSlideOffset] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  // Enhanced states for playback
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string>("");

  const buttonRef = useRef<HTMLButtonElement>(null);
  const touchStartYRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const isArabic = language === "ar";
  const CANCEL_THRESHOLD = 100;

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      setRecordedAudio(null);
      setAudioUrl(null);
      setTranscribedText("");

      // Enhanced audio settings for better quality
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000, // Optimized for Whisper
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Visual feedback with audio analyzer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 256;
      microphone.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const visualize = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(average / 255);
        animationFrameRef.current = requestAnimationFrame(visualize);
      };
      visualize();

      const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mimeType = types.find(t => MediaRecorder.isTypeSupported(t)) || "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000 // Higher quality recording
      });
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

      // Haptic feedback on start
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
      }

      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone error:", err);
      handleMicrophoneError(err);
      cleanup();
    }
  }, [language, isArabic]);

  const handleMicrophoneError = (err: any) => {
    if (err instanceof DOMException) {
      switch (err.name) {
        case "NotAllowedError":
          setError(isArabic ?
            "🎤 تم رفض إذن الميكروفون. افتح إعدادات المتصفح للسماح بالتسجيل." :
            "🎤 Permission micro refusée. Activez dans les paramètres du navigateur.");
          break;
        case "NotFoundError":
          setError(isArabic ?
            "🎤 لم يتم العثور على ميكروفون. تأكد من توصيل الميكروفون." :
            "🎤 Aucun microphone trouvé. Vérifiez votre connexion.");
          break;
        case "NotReadableError":
          setError(isArabic ?
            "🎤 الميكروفون قيد الاستخدام بواسطة تطبيق آخر" :
            "🎤 Microphone utilisé par une autre application");
          break;
        default:
          setError(isArabic ?
            "❌ خطأ في الوصول إلى الميكروفون" :
            "❌ Erreur d'accès au microphone");
      }
    } else {
      setError(isArabic ?
        "❌ حدث خطأ غير متوقع" :
        "❌ Une erreur inattendue s'est produite");
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Haptic feedback on stop
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

    // Haptic feedback on cancel
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 30, 30]);
    }
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

      if (!response.ok) throw new Error("Transcription failed");

      const data = await response.json();
      if (data.text && data.text.trim()) {
        setTranscribedText(data.text.trim());
      } else {
        setError(isArabic ?
          "🔊 لم يتم التعرف على الصوت. حاول التحدث بوضوح." :
          "🔊 Aucun son détecté. Parlez plus clairement.");
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setError(isArabic ?
        "⚠️ فشل التعرف على الصوت. تحقق من اتصال الإنترنت." :
        "⚠️ Échec de la transcription. Vérifiez votre connexion.");
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

  const handleReRecord = () => {
    cancelRecording();
    setShowPreview(false);
    startRecording();
  };

  const handleSendTranscript = () => {
    if (transcribedText) {
      onTranscript(transcribedText);
      setShowPreview(false);
      setRecordedAudio(null);
      setAudioUrl(null);
      setTranscribedText("");

      // Success haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 100, 50]);
      }
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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setRecordingTime(0);
    setVolume(0);
    setSlideOffset(0);
    setIsPlaying(false);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isProcessing) return;
    e.preventDefault();
    e.stopPropagation();
    touchStartYRef.current = e.touches[0].clientY;
    setIsTouching(true);
    startRecording();
  }, [disabled, isProcessing, startRecording]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTouching) return;
    const deltaY = touchStartYRef.current - e.touches[0].clientY;
    if (deltaY > 0) setSlideOffset(Math.min(deltaY, 150));
  }, [isTouching]);

  const handleTouchEnd = useCallback(() => {
    if (!isTouching) return;
    setIsTouching(false);

    if (slideOffset >= CANCEL_THRESHOLD) {
      cancelRecording();
    } else {
      stopRecording();
    }
    setSlideOffset(0);
  }, [isTouching, slideOffset, cancelRecording, stopRecording]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || isProcessing || showPreview) return;
    e.preventDefault();
    touchStartYRef.current = e.clientY;
    setIsTouching(true);
    startRecording();
  }, [disabled, isProcessing, showPreview, startRecording]);

  const handleMouseUp = useCallback(() => {
    if (!isTouching) return;
    setIsTouching(false);
    stopRecording();
  }, [isTouching, stopRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      cleanup();
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  return (
    <div className="relative">
      {/* Main Record Button */}
      {!showPreview && (
        <button
          ref={buttonRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          disabled={disabled || isProcessing}
          className={cn(
            "p-4 rounded-full transition-all duration-200 touch-none shadow-lg",
            isRecording ? "bg-red-500 scale-110 animate-pulse" :
            isProcessing ? "bg-gray-400" :
            "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 active:scale-95",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          title={isArabic ? "اضغط مع الاستمرار للتسجيل 🎤" : "Maintenez pour enregistrer 🎤"}
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>
      )}

      {/* Recording Modal */}
      {isRecording && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center animate-fade-in">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 shadow-2xl animate-slide-up relative">
            {/* Quit/Close Button */}
            <button
              onClick={cancelRecording}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label={isArabic ? "إلغاء التسجيل" : "Annuler l'enregistrement"}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div className={cn(
              "text-center mb-6 transition-all duration-300",
              slideOffset >= CANCEL_THRESHOLD ? "opacity-100 scale-110" : "opacity-60"
            )}>
              {slideOffset >= CANCEL_THRESHOLD && (
                <>
                  <ChevronUp className="w-10 h-10 mx-auto text-red-500 animate-bounce" />
                  <p className="text-sm text-red-500 font-semibold mt-2">
                    {isArabic ? "📱 اسحب لأعلى للإلغاء" : "📱 Glissez pour annuler"}
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col items-center gap-6">
              {/* Animated Mic Icon */}
              <div
                className="relative transition-all duration-200"
                style={{
                  transform: `translateY(-${slideOffset}px) scale(${1 + volume * 0.5})`,
                }}
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center shadow-xl">
                  <Mic className="w-12 h-12 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                {isRecording && (
                  <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"
                       style={{ animationDelay: '0.5s' }} />
                )}
              </div>

              {/* Timer */}
              <div className="text-4xl font-mono font-bold text-gray-800">
                {formatTime(recordingTime)}
              </div>

              {/* Volume Bars */}
              <div className="flex items-center gap-1 h-10 px-4">
                {[...Array(25)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-teal-500 to-teal-400 rounded-full transition-all duration-100"
                    style={{
                      height: `${Math.random() * volume * 100 < (i + 1) * 4 ?
                        12 + Math.random() * 28 : 4}px`,
                      opacity: volume > 0.1 ? 1 : 0.3
                    }}
                  />
                ))}
              </div>

              {/* Instructions */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 font-medium">
                  {isArabic ?
                    "🎙️ تحدث بوضوح للحصول على أفضل النتائج" :
                    "🎙️ Parlez clairement pour de meilleurs résultats"}
                </p>
                <p className="text-xs text-gray-500">
                  {isArabic ?
                    "ارفع إصبعك لإيقاف التسجيل" :
                    "Relâchez pour arrêter l'enregistrement"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && audioUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-semibold mb-4 text-center">
              {isArabic ? "معاينة التسجيل 🎵" : "Aperçu de l'enregistrement 🎵"}
            </h3>

            {/* Audio Player */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handlePlayPause}
                  className="p-3 rounded-full bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                  disabled={isProcessing}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </button>
                <Volume2 className="w-5 h-5 text-gray-400" />
                <div className="flex-1 h-1 bg-gray-200 rounded-full">
                  <div className="h-full w-1/3 bg-teal-500 rounded-full" />
                </div>
              </div>
            </div>

            {/* Transcribed Text */}
            {transcribedText && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 font-medium mb-1">
                  {isArabic ? "النص المحول:" : "Texte transcrit:"}
                </p>
                <p className="text-gray-700">{transcribedText}</p>
              </div>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-gray-500 mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  {isArabic ? "جاري التحويل..." : "Transcription en cours..."}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReRecord}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isArabic ? "إعادة التسجيل" : "Réenregistrer"}</span>
              </button>

              <button
                onClick={cancelRecording}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span>{isArabic ? "إلغاء" : "Annuler"}</span>
              </button>

              <button
                onClick={handleSendTranscript}
                disabled={!transcribedText || isProcessing}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  transcribedText && !isProcessing ?
                    "bg-teal-500 hover:bg-teal-600 text-white" :
                    "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
                <span>{isArabic ? "إرسال" : "Envoyer"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
            <X className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 hover:opacity-80 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}