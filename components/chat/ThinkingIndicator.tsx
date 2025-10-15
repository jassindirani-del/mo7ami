"use client";

/**
 * Elegant thinking indicator for when AI is processing
 * Smooth animations with legal-themed messaging
 */

import { Bot, Scale, FileSearch, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Language } from "@/lib/utils/language";
import { useEffect, useState } from "react";

interface ThinkingIndicatorProps {
  language: Language;
}

const THINKING_MESSAGES = {
  ar: [
    "جاري البحث في النصوص القانونية...",
    "جاري تحليل المواد القانونية...",
    "جاري جمع المعلومات من الجريدة الرسمية...",
    "جاري إعداد الإجابة مع المراجع...",
  ],
  fr: [
    "Recherche dans les textes juridiques...",
    "Analyse des articles de loi...",
    "Collecte d'informations du Bulletin Officiel...",
    "Préparation de la réponse avec références...",
  ],
  tz: [
    "ⴰⵔⵣⵣⵓ ⴳ ⵓⵏⵥⴰⵎⵏ ⵏ ⵓⵣⵔⴼ...",
    "ⴰⵙⴼⵙⵉ ⵏ ⵉⵎⴳⴳⵉⵜⵏ ⵏ ⵓⵣⵔⴼ...",
    "ⴰⵙⵎⵓⵏ ⵏ ⵜⵓⵜⵍⴰⵢⵉⵏ ⴳ ⵓⵙⵙⵏⴷ ⵓⵏⵚⵉⴱ...",
    "ⴰⴳⴰⴷⵉ ⵏ ⵜⵔⴰⵔⵓⵜ ⵙ ⵉⵙⵖⵏⴰⵙⵏ...",
  ],
};

export function ThinkingIndicator({ language }: ThinkingIndicatorProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const isArabic = language === "ar";
  const messages = THINKING_MESSAGES[language] || THINKING_MESSAGES.ar;

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-4 rounded-xl",
        "bg-gradient-to-br from-teal-50/60 to-cyan-50/40 border border-teal-100/40",
        "animate-in fade-in slide-in-from-bottom-2 duration-500"
      )}
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Animated avatar */}
      <div className="relative flex-shrink-0">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          "bg-gradient-to-br from-teal-500 to-cyan-500 shadow-md",
          "animate-pulse"
        )}>
          <Bot className="w-5 h-5 text-white" />
        </div>
        {/* Sparkle effect */}
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-3 h-3 text-amber-500 animate-ping" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Label */}
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            "text-xs font-semibold",
            "text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600"
          )}>
            {isArabic ? "محامي" : "Mo7ami"}
          </span>
          <div className="flex gap-1">
            <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>

        {/* Rotating thinking messages */}
        <div className="flex items-center gap-2">
          <div className="animate-spin">
            {messageIndex % 2 === 0 ? (
              <Scale className="w-4 h-4 text-teal-600" />
            ) : (
              <FileSearch className="w-4 h-4 text-teal-600" />
            )}
          </div>
          <span className={cn(
            "text-sm text-gray-600",
            "animate-in fade-in slide-in-from-right-2 duration-500"
          )}
            key={messageIndex}
          >
            {messages[messageIndex]}
          </span>
        </div>

        {/* Progress indicator */}
        <div className="mt-3 h-1 bg-teal-100/50 rounded-full overflow-hidden">
          <div className={cn(
            "h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full",
            "animate-[shimmer_2s_ease-in-out_infinite]"
          )} style={{ width: "60%" }} />
        </div>
      </div>
    </div>
  );
}
