"use client";

/**
 * Voice Live Inline Component
 *
 * Minimal, inline voice interface for OpenAI Realtime API
 * Clean design that fits naturally in the chat interface
 */

import { useState } from "react";
import { Mic, MicOff, Zap, Loader2, Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Language } from "@/lib/utils/language";
import { useRealtimeVoice } from "@/lib/hooks/useRealtimeVoice";

interface VoiceLiveInlineProps {
  language: Language;
  apiKey: string;
  onTranscript?: (text: string) => void;
}

export function VoiceLiveInline({ language, apiKey, onTranscript }: VoiceLiveInlineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isArabic = language === "ar" || language === "tz";
  // Realtime API only supports ar/fr, so default tz to ar
  const realtimeLanguage: "ar" | "fr" = language === "fr" ? "fr" : "ar";

  const voice = useRealtimeVoice({
    apiKey,
    language: realtimeLanguage,
    onTranscript: (text, isUser) => {
      if (isUser) {
        onTranscript?.(text);
      }
    },
    onError: (error) => {
      console.error("Voice error:", error);
    }
  });

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          voice.connect();
        }}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
          "bg-gradient-to-r from-purple-500 to-teal-500 text-white",
          "hover:from-purple-600 hover:to-teal-600",
          "transition-all duration-300 shadow-md hover:shadow-lg",
          "text-sm font-medium"
        )}
      >
        <Zap className="w-4 h-4" />
        <span>{isArabic ? "صوت مباشر" : "Voice Live"}</span>
        <span className="px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full">BETA</span>
      </button>
    );
  }

  return (
    <div className={cn(
      "relative p-4 rounded-xl border-2",
      voice.isConnected ? "border-teal-300 bg-teal-50/50" : "border-gray-200 bg-gray-50/50",
      "transition-all duration-300"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            voice.isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
          )} />
          <span className="text-sm font-medium text-gray-700">
            {isArabic ? "محادثة صوتية مباشرة" : "Conversation vocale live"}
          </span>
        </div>
        <button
          onClick={() => {
            voice.disconnect();
            setIsOpen(false);
          }}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Main Interface */}
      <div className="flex flex-col items-center gap-3">

        {/* Microphone Button */}
        <button
          onClick={voice.isListening ? voice.stopListening : voice.startListening}
          disabled={!voice.isConnected}
          className={cn(
            "relative p-8 rounded-full transition-all duration-300",
            voice.isListening
              ? "bg-red-500 hover:bg-red-600 scale-110 shadow-2xl shadow-red-300"
              : "bg-teal-500 hover:bg-teal-600 shadow-lg",
            !voice.isConnected && "opacity-50 cursor-not-allowed",
            "transform active:scale-95"
          )}
        >
          {voice.isListening ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}

          {/* Pulse effect when listening */}
          {voice.isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" />
              <div className="absolute inset-0 rounded-full bg-red-300 animate-ping opacity-10" style={{ animationDelay: "150ms" }} />
            </>
          )}
        </button>

        {/* Status Text */}
        <div className="text-center">
          {voice.isListening ? (
            <div className="flex items-center gap-2 text-red-600">
              <Mic className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">
                {isArabic ? "جاري الاستماع... انقر للإيقاف" : "Écoute... Cliquez pour arrêter"}
              </span>
            </div>
          ) : voice.isSpeaking ? (
            <div className="flex items-center gap-2 text-teal-600">
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">
                {isArabic ? "المساعد يتحدث..." : "L'assistant parle..."}
              </span>
            </div>
          ) : voice.isConnected ? (
            <span className="text-sm text-gray-600">
              {isArabic ? "انقر للتحدث" : "Cliquez pour parler"}
            </span>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                {isArabic ? "جاري الاتصال..." : "Connexion..."}
              </span>
            </div>
          )}
        </div>

        {/* Transcripts */}
        {(voice.userTranscript || voice.aiTranscript) && (
          <div className="w-full space-y-2 mt-2">
            {/* User transcript */}
            {voice.userTranscript && (
              <div className="p-3 bg-blue-100 border border-blue-200 rounded-lg">
                <p className="text-[10px] text-blue-600 font-semibold mb-1">
                  {isArabic ? "أنت:" : "Vous:"}
                </p>
                <p className="text-sm text-gray-800">{voice.userTranscript}</p>
              </div>
            )}

            {/* AI transcript */}
            {voice.aiTranscript && (
              <div className="p-3 bg-teal-100 border border-teal-200 rounded-lg">
                <p className="text-[10px] text-teal-600 font-semibold mb-1">
                  {isArabic ? "محامي:" : "Mo7ami:"}
                </p>
                <p className="text-sm text-gray-800">
                  {voice.aiTranscript}
                  {voice.isSpeaking && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-teal-500 animate-pulse" />
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {voice.error && (
          <div className="w-full p-3 bg-red-100 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{voice.error}</p>
          </div>
        )}

        {/* Tips */}
        <div className="text-center text-[10px] text-gray-500 mt-2">
          {isArabic
            ? "💡 تحدث بوضوح واسأل أسئلة قانونية محددة"
            : "💡 Parlez clairement et posez des questions juridiques précises"}
        </div>
      </div>
    </div>
  );
}
