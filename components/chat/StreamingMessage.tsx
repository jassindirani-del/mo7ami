"use client";

/**
 * Elegant streaming message component with smooth animations
 * ChatGPT-style word-by-word reveal with typing indicator
 */

import { useEffect, useState, useRef } from "react";
import { Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Language } from "@/lib/utils/language";

interface StreamingMessageProps {
  content: string;
  language: Language;
  isComplete: boolean;
  citations?: any[];
}

export function StreamingMessage({
  content,
  language,
  isComplete,
  citations = []
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const isArabic = language === "ar";

  // Smooth character-by-character reveal
  useEffect(() => {
    if (content.length === 0) {
      setDisplayedContent("");
      return;
    }

    // If content is already fully displayed, no need to animate
    if (displayedContent === content) {
      return;
    }

    // Calculate delay based on content length for smooth flow
    const delay = content.length > displayedContent.length + 10 ? 5 : 15;

    const timer = setTimeout(() => {
      if (displayedContent.length < content.length) {
        // Reveal next few characters for smoother animation
        const chunkSize = Math.min(2, content.length - displayedContent.length);
        setDisplayedContent(content.slice(0, displayedContent.length + chunkSize));
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [content, displayedContent]);

  // Cursor blinking effect
  useEffect(() => {
    if (isComplete) {
      setShowCursor(false);
      return;
    }

    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, [isComplete]);

  // Auto-scroll as content appears
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [displayedContent]);

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-5 rounded-xl transition-all duration-300",
        "bg-gradient-to-br from-teal-50/80 to-cyan-50/50 border border-teal-100/50",
        "animate-in fade-in slide-in-from-bottom-2 duration-500"
      )}
      dir={isArabic ? "rtl" : "ltr"}
      ref={contentRef}
    >
      {/* Avatar with pulse effect */}
      <div className="relative flex-shrink-0">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          "bg-gradient-to-br from-teal-500 to-cyan-500 shadow-md",
          !isComplete && "animate-pulse"
        )}>
          <Bot className="w-5 h-5 text-white" />
        </div>
        {!isComplete && (
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {/* Label */}
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            "text-xs font-semibold",
            "text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600"
          )}>
            {isArabic ? "محامي" : "Mo7ami"}
          </span>
          {!isComplete && (
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>

        {/* Streaming text with cursor */}
        <div className="prose prose-sm max-w-none">
          <div className={cn(
            "text-gray-800 leading-relaxed whitespace-pre-wrap break-words",
            isArabic ? "font-arabic text-right" : "font-sans text-left"
          )}>
            {displayedContent}
            {!isComplete && showCursor && (
              <span className="inline-block w-0.5 h-5 ml-0.5 bg-teal-600 animate-pulse" />
            )}
          </div>
        </div>

        {/* Citations - fade in when complete */}
        {isComplete && citations.length > 0 && (
          <div className={cn(
            "mt-4 pt-3 border-t border-teal-200/50",
            "animate-in fade-in slide-in-from-bottom-1 duration-700"
          )}>
            <div className="text-xs font-semibold text-teal-700 mb-2">
              {isArabic ? "📚 المراجع الرسمية" : "📚 Sources officielles"}
            </div>
            <div className="space-y-2">
              {citations.map((citation, index) => (
                <div
                  key={index}
                  className={cn(
                    "text-xs text-gray-600 p-2 rounded bg-white/60 border border-teal-100/30",
                    "hover:bg-white/90 hover:border-teal-200/60 transition-all duration-200",
                    "animate-in fade-in slide-in-from-bottom-1"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="font-medium text-teal-800">
                    {citation.source}
                  </div>
                  {citation.article && (
                    <div className="text-gray-500 mt-0.5">
                      {isArabic ? "المادة: " : "Article: "}
                      {citation.article}
                    </div>
                  )}
                  {citation.reference && (
                    <div className="text-gray-500 text-[10px] mt-0.5">
                      {citation.reference}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
