"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Mic, Paperclip, Smile, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Language } from "@/lib/utils/language";

interface ModernChatInputProps {
  onSendMessage: (message: string) => void;
  onVoiceInput: (transcript: string) => void;
  language: Language;
  disabled?: boolean;
}

export function ModernChatInput({
  onSendMessage,
  onVoiceInput,
  language,
  disabled = false,
}: ModernChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isArabic = language === "ar";

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Handle recording logic here
  };

  const placeholder = isArabic
    ? "اكتب رسالتك..."
    : "Écrivez votre message...";

  return (
    <div className="w-full">
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-sm border transition-all duration-300",
          isFocused ? "border-teal-400 shadow-md" : "border-gray-200",
          disabled && "opacity-50"
        )}
      >
        <div className="flex items-end">
          {/* Attachment Button */}
          <button
            type="button"
            className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={disabled}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            dir={isArabic ? "rtl" : "ltr"}
            className={cn(
              "flex-1 py-3 px-2 bg-transparent outline-none resize-none",
              "text-gray-800 placeholder:text-gray-400",
              "min-h-[48px] max-h-[120px]",
              isArabic ? "font-arabic text-right" : "text-left"
            )}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-1 p-2">
            {/* Emoji Button */}
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={disabled}
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Voice Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={cn(
                "p-2 rounded-full transition-all duration-200",
                isRecording
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-gray-400 hover:text-teal-600 hover:bg-teal-50"
              )}
              disabled={disabled}
            >
              {isRecording ? (
                <StopCircle className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={disabled || !message.trim()}
              className={cn(
                "p-2 rounded-full transition-all duration-200",
                disabled || !message.trim()
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-teal-500 hover:bg-teal-50 hover:text-teal-600"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}