"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Loader2, Send, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface OpenAIVoiceProps {
  onTranscript: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  onProcessingStateChange?: (isProcessing: boolean) => void;
  onTranscriptChange?: (transcript: string) => void;
  onAudioLevelChange?: (level: number) => void;
  language?: "ar" | "fr";
  className?: string;
  disabled?: boolean;
}

export function OpenAIVoice({
  onTranscript,
  onRecordingStateChange,
  onProcessingStateChange,
  onTranscriptChange,
  onAudioLevelChange,
  language = "ar",
  className,
  disabled = false
}: OpenAIVoiceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const isArabic = language === "ar";

  // Notify parent of state changes
  useEffect(() => {
    onRecordingStateChange?.(isRecording);
  }, [isRecording, onRecordingStateChange]);

  useEffect(() => {
    onProcessingStateChange?.(isProcessing);
  }, [isProcessing, onProcessingStateChange]);

  useEffect(() => {
    onTranscriptChange?.(transcript);
  }, [transcript, onTranscriptChange]);

  useEffect(() => {
    onAudioLevelChange?.(audioLevel);
  }, [audioLevel, onAudioLevelChange]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      chunksRef.current = [];
      setTranscript("");

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000, // Optimal for Whisper
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;

      // Setup audio visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start visualization
      visualizeAudio();

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        if (audioBlob.size > 0) {
          await transcribeAudio(audioBlob);
        }
        cleanup();
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

    } catch (err: any) {
      console.error("Recording error:", err);
      handleError(err);
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 30]);
      }
    }
  }, []);

  // Transcribe audio using OpenAI Whisper
  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("language", language);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/voice/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.text && data.text.trim()) {
        setTranscript(data.text.trim());
      } else {
        setError(isArabic ? "لم يتم التعرف على الصوت" : "Aucune transcription détectée");
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setError(isArabic
        ? "فشل التحويل الصوتي. تأكد من الاتصال بالإنترنت."
        : "Échec de la transcription. Vérifiez votre connexion.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Visualize audio levels
  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const draw = () => {
      if (!analyserRef.current || !isRecording) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // Handle errors
  const handleError = (err: any) => {
    let message = isArabic ? "حدث خطأ" : "Une erreur s'est produite";

    if (err instanceof DOMException) {
      switch (err.name) {
        case "NotAllowedError":
          message = isArabic
            ? "يرجى السماح بالوصول إلى الميكروفون"
            : "Veuillez autoriser l'accès au microphone";
          break;
        case "NotFoundError":
          message = isArabic
            ? "لم يتم العثور على ميكروفون"
            : "Aucun microphone trouvé";
          break;
      }
    }

    setError(message);
    setIsRecording(false);
  };

  // Cleanup
  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setAudioLevel(0);
  };

  // Send transcript
  const sendTranscript = () => {
    if (transcript) {
      onTranscript(transcript);
      setTranscript("");
    }
  };

  // Reset
  const reset = () => {
    setTranscript("");
    setError(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return (
    <>
      {/* Voice Button */}
      {!transcript && !isProcessing && (
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          className={cn(
            "p-2 rounded-lg transition-all relative",
            isRecording
              ? "bg-red-500 text-white animate-pulse"
              : disabled
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 shadow-md hover:shadow-lg active:scale-95",
            className
          )}
          title={isArabic ? "تسجيل صوتي" : "Enregistrement vocal"}
        >
          <Mic className="w-4 h-4" />
        </button>
      )}

      {/* Processing Spinner */}
      {isProcessing && (
        <div className="p-2">
          <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
        </div>
      )}

      {/* Transcript Actions */}
      {transcript && !isProcessing && (
        <div className="flex items-center gap-1">
          <button
            onClick={reset}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            title={isArabic ? "إعادة" : "Refaire"}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={sendTranscript}
            className="p-2 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 shadow-md transition-all active:scale-95"
            title={isArabic ? "إرسال" : "Envoyer"}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-red-50 border border-red-200 rounded-lg shadow-lg animate-in slide-in-from-bottom-2">
          <p className="text-xs text-red-700 text-center">{error}</p>
        </div>
      )}
    </>
  );
}