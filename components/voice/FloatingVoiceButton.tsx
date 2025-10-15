"use client";

import { useState, useEffect } from "react";
import { Mic, X, Loader2, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { VoiceRecorderRealtime } from "./VoiceRecorderRealtime";
import type { Language } from "@/lib/utils/language";

interface FloatingVoiceButtonProps {
  onTranscript: (text: string) => void;
  language: Language;
  disabled?: boolean;
}

export function FloatingVoiceButton({ onTranscript, language, disabled = false }: FloatingVoiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const isArabic = language === "ar";

  // Show tooltip after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) {
        setShowTooltip(true);
        // Hide tooltip after 5 seconds
        setTimeout(() => setShowTooltip(false), 5000);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleTranscript = (text: string) => {
    onTranscript(text);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Tooltip */}
        {showTooltip && !isOpen && (
          <div
            className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap animate-fade-in"
            style={{ animationDuration: '300ms' }}
          >
            {isArabic ? "اضغط للتحدث 🎤" : "Cliquez pour parler 🎤"}
            <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800" />
          </div>
        )}

        {/* Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "p-4 rounded-full shadow-lg transition-all duration-300",
            "hover:shadow-xl hover:scale-105 active:scale-95",
            isOpen
              ? "bg-gray-600 hover:bg-gray-700"
              : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700",
            disabled && "opacity-50 cursor-not-allowed",
            "relative"
          )}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}

          {/* Pulse animation when closed */}
          {!isOpen && !disabled && (
            <span className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-20" />
          )}
        </button>
      </div>

      {/* Voice Interface Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {isArabic ? "التحدث إلى محامي" : "Parler à Mo7ami"}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Voice Recorder */}
            <VoiceRecorderRealtime
              onTranscript={handleTranscript}
              language={language}
              disabled={disabled}
            />

            {/* Tips */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                💡 {isArabic
                  ? "تحدث بوضوح للحصول على أفضل النتائج"
                  : "Parlez clairement pour de meilleurs résultats"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}