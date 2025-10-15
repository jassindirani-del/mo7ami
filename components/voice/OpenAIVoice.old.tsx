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
      console.log("🎤 [OpenAI Voice] START RECORDING BUTTON CLICKED");
      console.log("🎤 [OpenAI Voice] API URL:", process.env.NEXT_PUBLIC_API_URL);

      setError(null);
      chunksRef.current = [];
      setTranscript("");

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia not supported in this browser");
      }

      console.log("🎤 [OpenAI Voice] Requesting microphone permission...");

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      console.log("✅ [OpenAI Voice] Microphone access granted!");
      console.log("🎤 [OpenAI Voice] Audio tracks:", stream.getAudioTracks().length);

      streamRef.current = stream;

      // Setup audio visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      console.log("🎤 [OpenAI Voice] Audio context created");

      // Start visualization
      visualizeAudio();

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      console.log("🎤 [OpenAI Voice] Using MIME type:", mimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        console.log("📦 [OpenAI Voice] Data available:", event.data.size, "bytes");
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("⏹️ [OpenAI Voice] Recording stopped");
        console.log("📦 [OpenAI Voice] Total chunks:", chunksRef.current.length);

        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        console.log("📦 [OpenAI Voice] Audio blob size:", audioBlob.size, "bytes");

        if (audioBlob.size > 0) {
          await transcribeAudio(audioBlob);
        } else {
          console.error("❌ [OpenAI Voice] Audio blob is empty!");
          setError(isArabic ? "لم يتم تسجيل صوت" : "Aucun audio enregistré");
        }
        cleanup();
      };

      mediaRecorder.start();
      setIsRecording(true);

      console.log("🎙️ [OpenAI Voice] MediaRecorder started, state:", mediaRecorder.state);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

    } catch (err: any) {
      console.error("❌ [OpenAI Voice] Recording error:", err);
      console.error("❌ [OpenAI Voice] Error name:", err.name);
      console.error("❌ [OpenAI Voice] Error message:", err.message);
      handleError(err);
    }
  }, [language, isArabic]);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log("⏹️ [OpenAI Voice] STOP RECORDING BUTTON CLICKED");

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log("⏹️ [OpenAI Voice] Stopping MediaRecorder...");
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 30]);
      }
    } else {
      console.warn("⚠️ [OpenAI Voice] MediaRecorder not in recording state:", mediaRecorderRef.current?.state);
    }
  }, []);

  // Transcribe audio using OpenAI Whisper
  const transcribeAudio = async (audioBlob: Blob) => {
    console.log("🔄 [OpenAI Voice] Starting transcription...");
    console.log("📦 [OpenAI Voice] Blob size:", audioBlob.size);
    console.log("📦 [OpenAI Voice] Blob type:", audioBlob.type);

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("language", language);

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/voice/transcribe`;
      console.log("📡 [OpenAI Voice] Sending to:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      console.log("📡 [OpenAI Voice] Response status:", response.status);
      console.log("📡 [OpenAI Voice] Response OK:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [OpenAI Voice] Server error:", errorText);
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ [OpenAI Voice] Transcription response:", data);

      if (data.text && data.text.trim()) {
        console.log("✅ [OpenAI Voice] Transcript:", data.text);
        setTranscript(data.text.trim());
      } else {
        console.warn("⚠️ [OpenAI Voice] Empty transcript received");
        setError(isArabic ? "لم يتم التعرف على الصوت" : "Aucune transcription détectée");
      }
    } catch (err) {
      console.error("❌ [OpenAI Voice] Transcription error:", err);
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
    console.log("🧹 [OpenAI Voice] Cleaning up...");

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("🧹 [OpenAI Voice] Stopped track:", track.kind);
      });
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
    console.log("📤 [OpenAI Voice] Sending transcript:", transcript);
    if (transcript) {
      onTranscript(transcript);
      setTranscript("");
    }
  };

  // Reset
  const reset = () => {
    console.log("🔄 [OpenAI Voice] Resetting...");
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
