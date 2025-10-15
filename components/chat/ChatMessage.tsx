"use client";

import { BookOpen, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Language } from "@/lib/utils/language";
import { AudioPlayer } from "@/components/voice/AudioPlayer";

interface Citation {
  source: string;
  article?: string;
  reference: string;
  url?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  language: Language;
  citations?: Citation[];
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isArabic = message.language === "ar";

  return (
    <div
      className={cn(
        "flex items-start gap-3 message-enter",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md overflow-hidden",
          isUser
            ? "bg-primary-600 text-white font-bold"
            : "bg-white border-2 border-teal-100"
        )}
      >
        {isUser ? (
          <span className="text-lg">👤</span>
        ) : (
          <img
            src="/logo1.png"
            alt="Mo7ami"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 max-w-4xl">
        <div
          className={cn(
            "rounded-2xl p-4 shadow-sm",
            isUser
              ? "bg-primary-600 text-white"
              : "bg-white text-gray-900 border border-gray-200"
          )}
        >
          <div className="flex items-start gap-3">
            <p
              className={cn(
                "whitespace-pre-wrap break-words flex-1 leading-relaxed text-base",
                isArabic ? "font-arabic text-right" : "text-left"
              )}
            >
              {message.content}
            </p>
            {/* Audio player for assistant messages */}
            {!isUser && (
              <AudioPlayer
                text={message.content}
                language={message.language}
              />
            )}
          </div>
        </div>

        {/* Citations */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BookOpen className="w-4 h-4" />
              <span className={isArabic ? "font-arabic" : ""}>
                {isArabic ? "المصادر القانونية:" : "Sources juridiques:"}
              </span>
            </div>
            <div className="space-y-2">
              {message.citations.map((citation, index) => (
                <CitationCard
                  key={index}
                  citation={citation}
                  language={message.language}
                />
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            "mt-2 text-xs text-gray-500",
            isUser ? "text-right" : "text-left"
          )}
        >
          {message.timestamp.toLocaleTimeString(
            isArabic ? "ar-MA" : "fr-FR",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )}
        </div>
      </div>
    </div>
  );
}

function CitationCard({
  citation,
  language,
}: {
  citation: Citation;
  language: Language;
}) {
  const isArabic = language === "ar";

  return (
    <a
      href={citation.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p
            className={cn(
              "font-medium text-gray-900 mb-1",
              isArabic ? "font-arabic text-right" : "text-left"
            )}
          >
            {citation.source}
          </p>
          {citation.article && (
            <p className="text-sm text-gray-600">
              {isArabic ? "المادة" : "Article"} {citation.article}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">{citation.reference}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary-600 flex-shrink-0" />
      </div>
    </a>
  );
}
