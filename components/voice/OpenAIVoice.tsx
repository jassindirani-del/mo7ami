"use client";

/**
 * Optimized OpenAI Voice Component
 *
 * Key improvements:
 * - Time-sliced recording (500ms chunks) for reliable data collection
 * - Minimum recording duration (1s) to prevent empty recordings
 * - Fallback MIME types for cross-browser compatibility
 * - Better error handling with user guidance
 * - Performance optimizations (32kbps bitrate, AbortController)
 * - Mobile haptic feedback
 * - Real-time duration counter
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Loader2, Send, RotateCcw, AlertCircle, Play, Square } from "lucide-react";
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

// Constants
const MIN_RECORDING_MS = 1000; // 1 second minimum
const TIMESLICE_MS = 500; // Collect chunks every 500ms
const TRANSCRIPTION_TIMEOUT_MS = 15000; // 15 second timeout
const OPTIMAL_BITRATE = 32000; // 32kbps for speech (not 128kbps!)

// Best MIME type detection (with fallbacks)
function getBestMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',  // Best: Chrome/Firefox
    'audio/ogg;codecs=opus',   // Fallback: Firefox
    'audio/webm',              // Generic WebM
    'audio/mp4',               // Safari
    ''                         // Browser default
  ];

  const supported = types.find(type =>
    type === '' || MediaRecorder.isTypeSupported(type)
  );

  console.log('🎵 Selected MIME type:', supported || 'browser default');
  return supported || '';
}

// Mobile detection
const isMobile = typeof navigator !== 'undefined' &&
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

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

  // Start recording with optimizations
  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 [Optimized Voice] Starting recording...');
      console.log('🌐 API URL:', process.env.NEXT_PUBLIC_API_URL);
      console.log('📱 Mobile device:', isMobile);

      setError(null);
      setPermissionError(null);
      chunksRef.current = [];
      setTranscript("");
      setRecordingDuration(0);

      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          isArabic
            ? 'المتصفح لا يدعم تسجيل الصوت'
            : 'Votre navigateur ne supporte pas l\'enregistrement audio'
        );
      }

      console.log('🎤 Requesting microphone permission...');

      // Optimized audio constraints
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 16000 }, // Whisper optimal
          channelCount: { ideal: 1 },   // Mono
          sampleSize: 16,                // 16-bit
        }
      };

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log('✅ Microphone access granted!');
      console.log('🎵 Audio tracks:', stream.getAudioTracks().length);

      streamRef.current = stream;

      // Setup audio visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      console.log('🎨 Audio visualization setup complete');

      // Start visualization
      visualizeAudio();

      // Get best MIME type with fallbacks
      const mimeType = getBestMimeType();

      // Setup MediaRecorder with optimized settings
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        audioBitsPerSecond: OPTIMAL_BITRATE, // 32kbps for speech
      });

      mediaRecorderRef.current = mediaRecorder;

      // CRITICAL: ondataavailable fires every TIMESLICE_MS
      mediaRecorder.ondataavailable = (event) => {
        console.log(`📦 Data chunk: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log(`📊 Total chunks collected: ${chunksRef.current.length}`);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('⏹️ Recording stopped');
        console.log(`📦 Total chunks: ${chunksRef.current.length}`);

        const duration = Date.now() - recordingStartTimeRef.current;
        console.log(`⏱️ Recording duration: ${duration}ms`);

        // Check minimum duration
        if (duration < MIN_RECORDING_MS) {
          console.warn(`⚠️ Recording too short (${duration}ms < ${MIN_RECORDING_MS}ms)`);
          setError(
            isArabic
              ? 'التسجيل قصير جداً. يرجى التحدث لمدة ثانية على الأقل.'
              : 'Enregistrement trop court. Parlez au moins 1 seconde.'
          );
          cleanup();
          return;
        }

        const audioBlob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm'
        });
        console.log(`📦 Audio blob: ${audioBlob.size} bytes`);

        if (audioBlob.size > 0) {
          // Save audio blob for playback
          setRecordedAudioBlob(audioBlob);

          // Start transcription (cleanup happens in parallel)
          const transcriptionPromise = transcribeAudio(audioBlob);
          cleanup(); // Don't wait for cleanup
          await transcriptionPromise;
        } else {
          console.error('❌ Audio blob is empty!');
          setError(
            isArabic
              ? 'لم يتم تسجيل أي صوت. حاول مرة أخرى.'
              : 'Aucun audio enregistré. Réessayez.'
          );
          cleanup();
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('❌ MediaRecorder error:', event.error);
        handleError(event.error);
      };

      // CRITICAL: Start with timeslice for reliable chunk collection
      recordingStartTimeRef.current = Date.now();
      mediaRecorder.start(TIMESLICE_MS);
      setIsRecording(true);

      console.log(`🎙️ Recording started (state: ${mediaRecorder.state})`);
      console.log(`⏱️ Timeslice: ${TIMESLICE_MS}ms`);

      // Start duration counter
      durationIntervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - recordingStartTimeRef.current;
        setRecordingDuration(Math.floor(elapsed / 1000));
      }, 100);

      // Haptic feedback (mobile)
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }

    } catch (err: any) {
      console.error('❌ Recording error:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      handleError(err);
    }
  }, [language, isArabic]);

  // Stop recording with minimum duration enforcement
  const stopRecording = useCallback(() => {
    console.log('⏹️ Stop button clicked');

    const duration = Date.now() - recordingStartTimeRef.current;
    console.log(`⏱️ Current duration: ${duration}ms`);

    // Clear duration interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Enforce minimum duration
    if (duration < MIN_RECORDING_MS) {
      const remainingMs = MIN_RECORDING_MS - duration;
      console.log(`⏳ Waiting ${remainingMs}ms to reach minimum duration...`);

      setError(
        isArabic
          ? `يرجى الانتظار ${Math.ceil(remainingMs / 1000)} ثانية...`
          : `Patientez ${Math.ceil(remainingMs / 1000)}s...`
      );

      setTimeout(() => {
        setError(null);
        stopRecording(); // Retry
      }, remainingMs);
      return;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('⏹️ Stopping MediaRecorder...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Haptic feedback (mobile)
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate([30, 30]); // Double pulse
      }
    } else {
      console.warn('⚠️ MediaRecorder not in recording state:', mediaRecorderRef.current?.state);
    }
  }, [isArabic]);

  // Optimized transcription with timeout and abort
  const transcribeAudio = async (audioBlob: Blob) => {
    console.log('🔄 Starting transcription...');
    console.log(`📦 Blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

    setIsProcessing(true);
    setError(null);

    // Create abort controller for timeout
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => {
      console.warn('⏰ Transcription timeout');
      controller.abort();
    }, TRANSCRIPTION_TIMEOUT_MS);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('language', language);

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/voice/transcribe`;
      console.log('📡 Sending to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📡 Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error:', errorText);
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Transcription response:', data);

      if (data.text && data.text.trim()) {
        const transcribedText = data.text.trim();
        console.log('✅ Transcript:', transcribedText);
        setTranscript(transcribedText);

        // CRITICAL: Notify parent immediately
        if (onTranscriptChange) {
          onTranscriptChange(transcribedText);
        }
      } else {
        console.warn('⚠️ Empty transcript received');
        setError(
          isArabic
            ? 'لم يتم التعرف على الصوت. حاول مرة أخرى.'
            : 'Aucune transcription détectée. Réessayez.'
        );
      }
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        console.error('❌ Transcription timeout');
        setError(
          isArabic
            ? 'انتهى وقت التحويل. حاول مرة أخرى.'
            : 'Délai d\'attente dépassé. Réessayez.'
        );
      } else {
        console.error('❌ Transcription error:', err);
        setError(
          isArabic
            ? 'فشل التحويل الصوتي. تحقق من الاتصال بالإنترنت.'
            : 'Échec de la transcription. Vérifiez votre connexion.'
        );
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
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

  // Handle errors with user guidance
  const handleError = (err: any) => {
    let message = isArabic ? 'حدث خطأ' : 'Une erreur s\'est produite';
    let guidance = '';

    if (err instanceof DOMException) {
      switch (err.name) {
        case 'NotAllowedError':
          message = isArabic
            ? 'تم رفض الوصول إلى الميكروفون'
            : 'Accès au microphone refusé';
          guidance = isArabic
            ? 'انقر على أيقونة القفل 🔒 في شريط العنوان ← السماح بالميكروفون'
            : 'Cliquez sur l\'icône 🔒 dans la barre d\'adresse → Autoriser le microphone';
          setPermissionError(guidance);
          break;

        case 'NotFoundError':
          message = isArabic
            ? 'لم يتم العثور على ميكروفون'
            : 'Aucun microphone trouvé';
          guidance = isArabic
            ? 'تأكد من توصيل ميكروفون بجهازك'
            : 'Vérifiez qu\'un microphone est connecté';
          setPermissionError(guidance);
          break;

        case 'NotReadableError':
          message = isArabic
            ? 'الميكروفون قيد الاستخدام'
            : 'Microphone déjà utilisé';
          guidance = isArabic
            ? 'أغلق التطبيقات الأخرى التي تستخدم الميكروفون'
            : 'Fermez les autres applications utilisant le microphone';
          setPermissionError(guidance);
          break;
      }
    }

    setError(message);
    setIsRecording(false);
  };

  // Cleanup resources
  const cleanup = () => {
    console.log('🧹 Cleaning up resources...');

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`🧹 Stopped ${track.kind} track`);
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

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    setAudioLevel(0);
    setRecordingDuration(0);
  };

  // Send transcript
  const sendTranscript = () => {
    console.log('📤 [OpenAIVoice] Sending transcript:', transcript);
    if (transcript) {
      onTranscript(transcript);
      setTranscript("");
      setRecordedAudioBlob(null);
      setError(null);
      setPermissionError(null);
    }
  };

  // Play recorded audio
  const playRecording = () => {
    if (!recordedAudioBlob) {
      console.warn('⚠️ No audio blob to play');
      return;
    }

    console.log('▶️ Playing recorded audio...');

    // Create audio element if needed
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
    }

    const audio = audioElementRef.current;
    const audioUrl = URL.createObjectURL(recordedAudioBlob);
    audio.src = audioUrl;

    audio.onplay = () => {
      setIsPlayingAudio(true);
      console.log('▶️ Audio playback started');
    };

    audio.onended = () => {
      setIsPlayingAudio(false);
      URL.revokeObjectURL(audioUrl);
      console.log('⏹️ Audio playback ended');
    };

    audio.onerror = (e) => {
      setIsPlayingAudio(false);
      URL.revokeObjectURL(audioUrl);
      console.error('❌ Audio playback error:', e);
      setError(
        isArabic
          ? 'فشل تشغيل التسجيل'
          : 'Échec de lecture'
      );
    };

    audio.play().catch((err) => {
      console.error('❌ Play failed:', err);
      setIsPlayingAudio(false);
      URL.revokeObjectURL(audioUrl);
    });
  };

  // Stop playing audio
  const stopPlaying = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      setIsPlayingAudio(false);
      console.log('⏹️ Audio playback stopped');
    }
  };

  // Reset
  const reset = () => {
    console.log('🔄 Resetting...');
    stopPlaying();
    setTranscript("");
    setRecordedAudioBlob(null);
    setError(null);
    setPermissionError(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
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
            "p-2 rounded-lg transition-all relative touch-feedback",
            isRecording
              ? "bg-red-500 text-white animate-pulse"
              : disabled
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 shadow-md hover:shadow-lg active:scale-95",
            className
          )}
          title={
            isRecording
              ? (isArabic ? 'إيقاف التسجيل' : 'Arrêter l\'enregistrement')
              : (isArabic ? 'تسجيل صوتي' : 'Enregistrement vocal')
          }
          data-recording={isRecording}
        >
          <Mic className="w-4 h-4" />

          {/* Recording duration badge */}
          {isRecording && recordingDuration > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse">
              {recordingDuration}s
            </span>
          )}
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
          {/* Play/Stop Button */}
          {recordedAudioBlob && (
            <button
              onClick={isPlayingAudio ? stopPlaying : playRecording}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isPlayingAudio
                  ? "bg-red-100 hover:bg-red-200 text-red-600"
                  : "bg-blue-100 hover:bg-blue-200 text-blue-600"
              )}
              title={isPlayingAudio
                ? (isArabic ? 'إيقاف' : 'Arrêter')
                : (isArabic ? 'تشغيل التسجيل' : 'Écouter')
              }
            >
              {isPlayingAudio ? (
                <Square className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          )}

          <button
            onClick={reset}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            title={isArabic ? 'إعادة' : 'Refaire'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={sendTranscript}
            className="p-2 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 shadow-md transition-all active:scale-95"
            title={isArabic ? 'إرسال' : 'Envoyer'}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Permission Error with Guidance */}
      {permissionError && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg shadow-lg animate-in slide-in-from-bottom-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-800 mb-1">{error}</p>
              <p className="text-xs text-amber-700">{permissionError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && !permissionError && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-red-50 border border-red-200 rounded-lg shadow-lg animate-in slide-in-from-bottom-2">
          <p className="text-xs text-red-700 text-center">{error}</p>
        </div>
      )}
    </>
  );
}
