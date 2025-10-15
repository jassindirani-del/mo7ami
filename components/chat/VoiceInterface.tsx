"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, X, Send, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface VoiceInterfaceProps {
  onTranscript: (text: string) => void;
  language?: "ar" | "fr";
}

export function VoiceInterface({ onTranscript, language = "ar" }: VoiceInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isArabic = language === "ar";

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      streamRef.current = stream;

      // Audio visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start visualizing
      visualize();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        // Process audio here
        simulateTranscription();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const visualize = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const draw = () => {
      if (!isRecording) return;

      requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);
    };

    draw();
  };

  const simulateTranscription = () => {
    // Simulate transcription
    setTimeout(() => {
      setTranscript(isArabic
        ? "هذا مثال على النص المحول من الصوت"
        : "Ceci est un exemple de texte transcrit");
    }, 1000);
  };

  const handleSend = () => {
    if (transcript) {
      onTranscript(transcript);
      setTranscript("");
    }
  };

  const handleReset = () => {
    setTranscript("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Mic Button */}
      {!isRecording && !transcript && (
        <button
          onClick={startRecording}
          className="group relative p-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300"
        >
          <Mic className="w-6 h-6 text-white" />

          {/* Pulse Effect */}
          <span className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-25"></span>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
              {isArabic ? "اضغط للتسجيل" : "Cliquez pour enregistrer"}
              <div className="absolute top-full right-6 w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-gray-800 border-r-[6px] border-r-transparent"></div>
            </div>
          </div>
        </button>
      )}

      {/* Recording Interface */}
      {(isRecording || transcript) && (
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">
              {isRecording
                ? (isArabic ? "جاري التسجيل..." : "Enregistrement...")
                : (isArabic ? "النص المحول" : "Texte transcrit")}
            </h3>
            <button
              onClick={() => {
                stopRecording();
                setTranscript("");
              }}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Recording Animation */}
          {isRecording && (
            <div className="flex flex-col items-center py-6">
              <div className="relative">
                <div className={cn(
                  "w-20 h-20 rounded-full bg-red-500 flex items-center justify-center",
                  "transform transition-transform",
                  `scale-${Math.min(150, 100 + audioLevel * 50) / 100}`
                )}>
                  <MicOff className="w-8 h-8 text-white" />
                </div>

                {/* Audio Level Rings */}
                <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border-4 border-red-200 animate-ping animation-delay-200"></div>
              </div>

              {/* Waveform */}
              <div className="flex items-center gap-1 mt-6">
                {[...Array(15)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-400 rounded-full transition-all"
                    style={{
                      height: `${8 + Math.random() * audioLevel * 40}px`,
                    }}
                  />
                ))}
              </div>

              <button
                onClick={stopRecording}
                className="mt-6 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                {isArabic ? "إيقاف" : "Arrêter"}
              </button>
            </div>
          )}

          {/* Transcript Display */}
          {transcript && !isRecording && (
            <div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-gray-800 leading-relaxed">{transcript}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isArabic ? "إعادة" : "Refaire"}</span>
                </button>

                <button
                  onClick={handleSend}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:shadow-lg text-white rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isArabic ? "إرسال" : "Envoyer"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}