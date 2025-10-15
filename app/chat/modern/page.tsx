"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, Bot, User, Sparkles, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { Language } from "@/lib/utils/language";
import { OpenAIVoice } from "@/components/voice/OpenAIVoice";
import axios from "axios";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ModernChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState<Language>("ar");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isArabic = language === "ar";

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = useCallback(async (messageText?: string) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Call the actual API
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat`,
        {
          message: textToSend,
          language: language,
          conversation_id: null,
        }
      );

      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: response.data.answer || "لم أتمكن من الإجابة. حاول مرة أخرى.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      // Fallback message
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: isArabic
          ? "عذراً، حدث خطأ. تأكد من اتصال الخادم وحاول مرة أخرى."
          : "Désolé, une erreur s'est produite. Vérifiez la connexion au serveur.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, language, isArabic]);

  // Handle voice input
  const handleVoiceTranscript = useCallback((transcript: string) => {
    handleSend(transcript);
  }, [handleSend]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Modern Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-800">محامي</h1>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === "ar" ? "fr" : "ar")}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              {language === "ar" ? "FR" : "ع"}
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {isArabic ? "مرحباً بك في محامي" : "Bienvenue chez Mo7ami"}
              </h2>
              <p className="text-gray-500">
                {isArabic
                  ? "اسأل أي سؤال حول القانون المغربي"
                  : "Posez toute question sur le droit marocain"}
              </p>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mt-8 max-w-md mx-auto">
                {[
                  { ar: "قانون الأسرة", fr: "Droit de la famille" },
                  { ar: "القانون الجنائي", fr: "Droit pénal" },
                  { ar: "قانون الشغل", fr: "Droit du travail" },
                  { ar: "القانون التجاري", fr: "Droit commercial" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputValue(isArabic ? item.ar : item.fr)}
                    className="p-3 bg-white border border-gray-200 rounded-xl hover:border-teal-400 hover:bg-teal-50 transition-all text-sm"
                  >
                    {isArabic ? item.ar : item.fr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[70%] p-4 rounded-2xl",
                  msg.role === "user"
                    ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white"
                    : "bg-white border border-gray-100 text-gray-800"
                )}
              >
                <p className="leading-relaxed">{msg.content}</p>
                <p className="text-xs mt-2 opacity-70">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Modern Input Area */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-2 focus-within:bg-white focus-within:shadow-lg transition-all">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isArabic ? "اكتب سؤالك..." : "Tapez votre question..."}
              className="flex-1 bg-transparent px-4 py-3 outline-none text-gray-800 placeholder:text-gray-400"
              dir={isArabic ? "rtl" : "ltr"}
            />

            {/* Voice Button with OpenAI Integration */}
            <OpenAIVoice
              onTranscript={handleVoiceTranscript}
              language={language === "fr" ? "fr" : "ar"}
            />

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim()}
              className={cn(
                "p-3 rounded-xl transition-all",
                inputValue.trim()
                  ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:shadow-lg transform hover:scale-105"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Character Count */}
          <div className="flex justify-between mt-2 px-2">
            <p className="text-xs text-gray-400">
              {isArabic ? "اضغط Enter للإرسال" : "Appuyez sur Entrée pour envoyer"}
            </p>
            {inputValue.length > 0 && (
              <p className="text-xs text-gray-400">{inputValue.length}/500</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}