"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Language } from "@/lib/utils/language";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onVoiceInput: (transcript: string) => void;
  language: Language;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  onVoiceInput,
  language,
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isArabic = language === "ar";

  // Update message when voice transcript changes
  useEffect(() => {
    if (voiceTranscript && !isProcessing) {
      console.log('✅ [ChatInput] Setting message from transcript:', voiceTranscript);
      setMessage(voiceTranscript);

      // Auto-resize textarea to fit content
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${Math.min(
            textareaRef.current.scrollHeight,
            200
          )}px`;
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [voiceTranscript, isProcessing]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      setVoiceTranscript("");
      // Reset textarea height
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
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    console.log('📝 [ChatInput] Received transcript:', transcript);
    if (transcript) {
      // Set transcript to voiceTranscript state (NOT message yet)
      setVoiceTranscript(transcript);
      // Note: Message will be set when user clicks Send button from OpenAIVoice
    }
  };

  const placeholder = isArabic
    ? "اكتب سؤالك هنا أو استخدم الميكروفون..."
    : "Tapez votre question ou utilisez le microphone...";

  return (
    <div className="relative">
      {/* Enhanced Input Container */}
      <div
        className={cn(
          "relative flex items-end gap-1.5 p-2 glass-card rounded-xl transition-all duration-300",
          disabled && "opacity-50",
          isRecording && "ring-2 ring-red-400 shadow-lg shadow-red-100",
          isProcessing && "ring-2 ring-teal-400 shadow-lg shadow-teal-100 animate-pulse",
          !isRecording && !isProcessing && "focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:shadow-md"
        )}
      >
        {/* Wave Animation Background (Recording State) */}
        {isRecording && (
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            <div className="wave-animation absolute inset-0"></div>
          </div>
        )}

        {/* Processing Shimmer Effect */}
        {isProcessing && (
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            <div className="shimmer-animation absolute inset-0"></div>
          </div>
        )}

        {/* Audio Level Indicator (Subtle Bars) */}
        {isRecording && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-red-400 rounded-full transition-all duration-75"
                style={{
                  height: `${4 + Math.sin((audioLevel * 10 + i) * 0.5) * 12}px`,
                  opacity: 0.5 + audioLevel * 0.5
                }}
              />
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? (isArabic ? "🎙️ جارٍ التسجيل..." : "🎙️ Recording...") : placeholder}
          disabled={disabled || isRecording}
          rows={1}
          dir={isArabic ? "rtl" : "ltr"}
          className={cn(
            "flex-1 resize-none outline-none bg-transparent px-2 py-2 text-sm relative z-10",
            "placeholder:text-gray-400 max-h-[200px]",
            isArabic ? "font-arabic text-right" : "text-left",
            isRecording && "pl-14"
          )}
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-1 relative z-10">
          {/* Voice Component - Removed (using VoiceLiveInline in chat page instead) */}

          {/* Send Button */}
          {(
            <button
              type="button"
              onClick={handleSend}
              disabled={disabled || !message.trim() || isRecording}
              className={cn(
                "p-2 rounded-lg transition-all active:scale-95",
                disabled || !message.trim() || isRecording
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 shadow-md"
              )}
              title={isArabic ? "إرسال" : "Envoyer"}
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Recording Status Text */}
      {isRecording && (
        <div className="absolute -top-8 left-0 right-0 text-center">
          <p className="text-xs text-red-600 font-medium animate-pulse">
            {isArabic ? "🎙️ انقر على الميكروفون للتوقف" : "🎙️ Click mic to stop"}
          </p>
        </div>
      )}

      {/* Processing Status Text */}
      {isProcessing && (
        <div className="absolute -top-8 left-0 right-0 text-center">
          <p className="text-xs text-teal-600 font-medium">
            {isArabic ? "⚡ جاري معالجة الصوت..." : "⚡ Processing audio..."}
          </p>
        </div>
      )}
    </div>
  );
}
