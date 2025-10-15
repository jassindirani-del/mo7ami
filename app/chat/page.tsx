"use client";

export const dynamic = "force-dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { VoiceLiveInline } from "@/components/voice/VoiceLiveInline";
import { StreamingMessage } from "@/components/chat/StreamingMessage";
import { ThinkingIndicator } from "@/components/chat/ThinkingIndicator";
import { detectLanguage, getDirection, type Language } from "@/lib/utils/language";
import { useStreamingChat } from "@/lib/hooks/useStreamingChat";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  language: Language;
  citations?: Citation[];
  timestamp: Date;
}

interface Citation {
  source: string;
  article?: string;
  reference: string;
  url?: string;
}

const ROTATING_EXAMPLES: Record<Language, string[][]> = {
  ar: [
    [
      "شنو كايقول القانون الجنائي على السرقة؟",
      "واش عندي الحق نطلب الطلاق؟",
      "كيفاش نسجل شركة جديدة؟",
    ],
    [
      "شنو هي حقوق العامل في المغرب؟",
      "كيفاش نقدم شكاية للبوليس؟",
      "شنو هي عقوبة التشهير الإلكتروني؟",
    ],
    [
      "كيفاش نحمي العلامة التجارية ديالي؟",
      "شنو الإجراءات باش نسترجع المال من منتوج معيب؟",
      "شنو شروط الحصول على رخصة محل تجاري؟",
    ],
    [
      "شنو هي حقوق المستهلك في التبادل الإلكتروني؟",
      "شنو الإجراءات ديال الإرث؟",
      "كيفاش نلغى عقد الكراء قبل ما يسالي؟",
    ],
  ],
  fr: [
    [
      "Que dit le code pénal sur le vol ?",
      "Ai-je le droit de demander le divorce ?",
      "Comment enregistrer une nouvelle entreprise ?",
    ],
    [
      "Quels sont les droits des salariés au Maroc ?",
      "Comment déposer une plainte à la police ?",
      "Quelle est la sanction pour la diffamation en ligne ?",
    ],
    [
      "Comment protéger ma marque commerciale ?",
      "Quelles étapes pour récupérer l'argent d'un produit défectueux ?",
      "Quelles conditions pour obtenir une licence de commerce ?",
    ],
    [
      "Quels sont les droits du consommateur dans la vente en ligne ?",
      "Quelle est la procédure de succession ?",
      "Comment résilier un bail avant son terme ?",
    ],
  ],
  tz: [
    [
      "ⵎⴰ ⵉⵜⵜⵉⵏⵉ ⵓⵏⵥⴰⵕ ⵅⴼ ⵜⵓⴽⴽⵔⴹⴰ ?",
      "ⵉⵙ ⵖⵓⵔⵉ ⴰⵣⵔⴼ ⴰⴷ ⵙⵙⵓⵜⵔⵖ ⴰⵍⴰⵢ ?",
      "ⵎⴰⵎⴽ ⴰⴷ ⵙⵙⵔⴱⵓⵖ ⵜⴰⵙⴱⴱⴰⴱⵜ ⵜⴰⵎⴰⵢⵏⵓⵜ ?",
    ],
    [
      "ⵎⴰⵏ ⴰⵢⴰ ⵉⵣⵔⴼⴰⵏ ⵏ ⵓⵎⵅⴷⴰⵎ ⴷⵉ ⵍⵎⵖⵔⵉⴱ ?",
      "ⵎⴰⵎⴽ ⴰⴷ ⴳⵖ ⵜⴰⵎⵓⴽⵔⵉⵙⵜ ⵖⵔ ⵉⴱⵓⵍⵉⵙⵉⵢⵏ ?",
      "ⵎⴰ ⵢⴰⴷ ⵉⴳⴰⵏ ⵓⵣⴰⵢⴰⵣ ⵅⴼ ⵓⵙⵙⵅⵙⵉ ?",
    ],
    [
      "ⵎⴰⵎⴽ ⴰⴷ ⵃⴹⵓⵖ ⵜⴰⵎⴰⵜⴰⵔⵜ ⵉⵏⵓ ?",
      "ⵎⴰ ⴰⴷ ⴳⵖ ⴱⴰⵛ ⴰⴷ ⴷⵉ ⴷⴷⵎⵖ ⵉⴷⵔⵉⵎⵏ ?",
      "ⵎⴰ ⴰⴷ ⴳⴰⵏ ⵉⴼⵓⵍⴰⵏ ⵉ ⵜⵓⵔⴰⴳⵜ ?",
    ],
    [
      "ⵎⴰⵏ ⴰⵢⴰ ⵉⵣⵔⴼⴰⵏ ⵏ ⵓⵎⵙⵙⴰⵖ ?",
      "ⵎⴰⵎⴽ ⴰⴷ ⵙⵙⵓⵜⵜⵔⵖ ⴰⵍⴰⵢ ?",
      "ⵎⴰ ⵢⴰⴷ ⵉⴳⴰⵏ ⵓⵏⵥⴰⵕ ⵅⴼ ⵜⵡⵓⵔⵉ ?",
    ],
  ],
};

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [language, setLanguage] = useState<Language>("ar");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // New: sidebar collapse state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ remaining: number; limit: number } | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const CLIENT_TOKEN_KEY = "mo7ami_client_token";
  const isArabic = language === "ar";
  const router = useRouter();
  const [processedPrompt, setProcessedPrompt] = useState<string | null>(null);

  // Streaming state
  const [streamingMessage, setStreamingMessage] = useState<{
    content: string;
    citations: any[];
    isComplete: boolean;
  } | null>(null);

  // Streaming chat hook
  const streaming = useStreamingChat({
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    onStreamStart: () => {
      console.log("Stream started");
    },
    onChunk: (chunk) => {
      // Update streaming message content
      setStreamingMessage(prev => ({
        content: (prev?.content || "") + chunk,
        citations: prev?.citations || [],
        isComplete: false,
      }));
    },
    onComplete: (fullText, citations, metadata) => {
      // Mark streaming as complete
      setStreamingMessage(prev => ({
        content: fullText,
        citations,
        isComplete: true,
      }));

      // Add completed message to chat history
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: fullText,
        language: detectLanguage(fullText),
        citations,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Update conversation metadata
      setConversationId(metadata.conversation_id);
      setUsage({
        remaining: metadata.remaining_questions,
        limit: metadata.daily_limit,
      });
      setUsageError(null);

      // Clear streaming state
      setTimeout(() => {
        setStreamingMessage(null);
      }, 100);
    },
    onError: (error) => {
      console.error("Streaming error:", error);
      setStreamingMessage(null);

      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content:
          language === "ar"
            ? "عذراً، حدث خطأ. الرجاء المحاولة مرة أخرى."
            : "Désolé, une erreur s'est produite. Veuillez réessayer.",
        language,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    },
  });

  // Ensure a persistent client token for anonymous usage tracking
  useEffect(() => {
    if (typeof window === "undefined") return;
    let token = window.localStorage.getItem(CLIENT_TOKEN_KEY);
    if (!token) {
      token = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
      window.localStorage.setItem(CLIENT_TOKEN_KEY, token);
    }
    setClientToken(token);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, voice }: { content: string; voice: boolean }) => {
      if (!clientToken) {
        throw new Error("CLIENT_TOKEN_NOT_READY");
      }

      const detectedLang = detectLanguage(content);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat`,
        {
          message: content,
          language: detectedLang,
          conversation_id: conversationId,
          voice_input: voice,
          user_id: session?.user?.id ?? null,
          client_token: clientToken,
        }
      );
      return { ...response.data, detectedLang };
    },
    onSuccess: (data, variables) => {
      // Add assistant's response
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: data.answer,
        language: data.language,
        citations: data.citations,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(data.conversation_id);
      setUsage({ remaining: data.remaining_questions, limit: data.daily_limit });
      setUsageError(null);
    },
    onError: (error: any) => {
      if ((error as Error).message === "CLIENT_TOKEN_NOT_READY") {
        console.warn("Client token not initialised yet");
        return;
      }

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        if (statusCode === 429) {
          const limit = Number(error.response?.data?.detail?.limit ?? (session?.user?.id ? 10 : 5));
          setUsage({ remaining: 0, limit });
          setUsageError(
            session?.user?.id
              ? isArabic
                ? "لقد وصلت إلى الحد اليومي لهذه الخدمة. جرّب مرة أخرى غداً."
                : "Vous avez atteint votre quota quotidien. Réessayez demain."
              : isArabic
                ? "لقد استهلكت الحصة المجانية لليوم. سجّل الدخول للحصول على عشرة أسئلة يومياً."
                : "Vous avez utilisé votre quota gratuit. Connectez-vous pour obtenir dix questions par jour."
          );
          return;
        }

        if (statusCode === 500) {
          setUsageError(
            isArabic
              ? "تعذر الحصول على الإجابة حالياً. تأكد من إعداد مفتاح OpenAI في الخادم أو أعد المحاولة لاحقاً."
              : "Impossible de récupérer la réponse. Vérifiez la clé OpenAI côté serveur ou réessayez plus tard."
          );
          return;
        }
      }

      console.error("Error sending message:", error);
      // Add error message
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content:
          language === "ar"
            ? "عذراً، حدث خطأ. الرجاء المحاولة مرة أخرى."
            : "Désolé, une erreur s'est produite. Veuillez réessayer.",
        language,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const handleSendMessage = useCallback(
    (content: string, voice = false) => {
      if (!clientToken) {
        return;
      }

      if (usage?.remaining === 0) {
        if (!session?.user?.id) {
          setUsageError(
            isArabic
              ? "سجّل الدخول للحصول على عشرة أسئلة يومياً."
              : "Connectez-vous pour profiter de dix questions par jour."
          );
        }
        return;
      }

      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        role: "user",
        content,
        language: detectLanguage(content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Clear any previous streaming message
      setStreamingMessage(null);

      // Use streaming API
      streaming.sendMessage({
        message: content,
        language: detectLanguage(content),
        conversationId,
        voiceInput: voice,
        userId: session?.user?.id ?? null,
        clientToken,
      });
    },
    [clientToken, usage?.remaining, session?.user?.id, isArabic, streaming, conversationId, session?.user?.id]
  );

  const handleVoiceInput = (transcript: string) => {
    handleSendMessage(transcript, true);
  };

  const direction = getDirection(language);

  useEffect(() => {
    if (status === "unauthenticated") {
      setConversationId(null);
    }
  }, [status]);

  useEffect(() => {
    setUsage(null);
    setUsageError(null);
  }, [session?.user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const prompt = params.get("prompt");
    const langParam = params.get("lang");

    if (langParam) {
      const normalizedLang = langParam === "fr" ? "fr" : "ar";
      if (normalizedLang !== language) {
        setLanguage(normalizedLang as Language);
      }
    }

    if (!prompt || processedPrompt === prompt || !clientToken) {
      return;
    }

    setMessages([]);
    setConversationId(null);
    setUsage(null);
    setUsageError(null);
    handleSendMessage(prompt);
    setProcessedPrompt(prompt);
    router.replace("/chat");
  }, [clientToken, handleSendMessage, processedPrompt, router, language]);

  if (status === "loading" || !clientToken) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-sm">Loading session…</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/20" dir={direction}>
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <ChatHeader
          onHistoryClick={() => setIsSidebarOpen(!isSidebarOpen)}
          language={language}
          messages={messages}
          onNewChat={() => {
            setMessages([]);
            setIsSidebarOpen(false);
            setConversationId(null);
            setUsageError(null);
          }}
          showHistory={isSidebarOpen}
        />

        {/* Messages area - More compact */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <EmptyState language={language} onExampleClick={handleSendMessage} />
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}

                {/* Show thinking indicator while preparing */}
                {streaming.isPreparing && (
                  <ThinkingIndicator language={language} />
                )}

                {/* Show streaming message while streaming or complete */}
                {streamingMessage && streaming.isStreaming && (
                  <StreamingMessage
                    content={streamingMessage.content}
                    language={language}
                    isComplete={streamingMessage.isComplete}
                    citations={streamingMessage.citations}
                  />
                )}

                {/* Fallback to old loading message for mutation-based requests */}
                {sendMessageMutation.isPending && !streaming.isPreparing && !streaming.isStreaming && (
                  <LoadingMessage language={language} />
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area - Compact & Elegant */}
        <div className="border-t border-gray-200/50 glass-card">
          <div className="max-w-4xl mx-auto px-3 py-2.5">
            {!session?.user?.id && (
              <div className="mb-2 rounded-lg bg-gradient-to-r from-teal-50 to-teal-50/50 px-3 py-2 text-xs text-teal-800 border border-teal-200/50">
                {isArabic
                  ? "خمس أسئلة مجانية يومياً. سجّل الدخول للحصول على عشرة."
                  : "Cinq questions gratuites par jour. Connectez-vous pour dix."}
                <button
                  onClick={() => signIn("google")}
                  className="ml-2 rounded-lg bg-teal-600 px-2.5 py-1 text-[10px] text-white hover:bg-teal-700 transition-colors"
                >
                  {isArabic ? "تسجيل الدخول" : "Se connecter"}
                </button>
              </div>
            )}

            {usageError && (
              <div className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 border border-amber-200/50">
                {usageError}
              </div>
            )}

            {usage && usage.remaining >= 0 && (
              <div className="mb-1 text-[10px] text-gray-500 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                {isArabic
                  ? `المتبقية: ${usage.remaining} / ${usage.limit}`
                  : `Restantes: ${usage.remaining} / ${usage.limit}`}
              </div>
            )}

            <ChatInput
              onSendMessage={handleSendMessage}
              onVoiceInput={handleVoiceInput}
              language={language}
              disabled={sendMessageMutation.isPending || usage?.remaining === 0}
            />

            {/* Voice Live Inline - NEW! */}
            <div className="mt-2.5">
              <VoiceLiveInline
                language={language}
                apiKey={process.env.NEXT_PUBLIC_OPENAI_API_KEY || ""}
                onTranscript={handleVoiceInput}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ language, onExampleClick }: { language: Language; onExampleClick: (text: string) => void }) {
  const exampleSets = ROTATING_EXAMPLES[language];
  const totalSets = exampleSets.length;
  const [setIndex, setSetIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    setSetIndex(0);
    setTransitioning(false);
  }, [language]);

  useEffect(() => {
    if (totalSets <= 1) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setTransitioning(true);
      timeout = setTimeout(() => {
        setSetIndex((prev) => (prev + 1) % totalSets);
        setTransitioning(false);
      }, 250);
    }, 5000);

    return () => {
      clearInterval(interval);
      if (timeout) clearTimeout(timeout);
      setTransitioning(false);
    };
  }, [totalSets, language]);

  const currentExamples = exampleSets[setIndex] ?? [];

  return (
    <div className="text-center py-8">
      <div className="mb-6">
        {/* Compact Logo */}
        <div className="flex justify-center mb-4">
          <img
            src="/logo1.png"
            alt="Mo7ami Logo"
            className="w-24 h-24 object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
          {language === "ar" ? "محامي" : "Mo7ami"}
        </h1>
        <p className="text-lg text-teal-700 font-semibold">
          {language === "ar"
            ? "مساعدك القانوني الذكي"
            : "Votre assistant juridique intelligent"}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-700 font-medium">
          {language === "ar" ? "أمثلة على الأسئلة:" : "Exemples de questions:"}
        </p>
        <div className="grid gap-2 max-w-2xl mx-auto overflow-hidden">
          {currentExamples.map((example, i) => (
            <div
              key={`${setIndex}-${i}`}
              onClick={() => onExampleClick(example)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onExampleClick(example);
                }
              }}
              className={cn(
                "glass-card p-3 hover:bg-white/90 hover:border-teal-500/30 transition-all cursor-pointer transform group",
                "hover:scale-[1.02] active:scale-[0.98] duration-200",
                transitioning ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
              )}
            >
              <p className="text-sm text-gray-700 group-hover:text-teal-700 transition-colors">{example}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-3 bg-gradient-to-r from-yellow-50 to-yellow-50/50 border border-yellow-200/50 rounded-lg max-w-2xl mx-auto">
        <p className="text-xs text-gray-700">
          {language === "ar"
            ? "💡 يمكنك استخدام الصوت أو الكتابة للسؤال"
            : "💡 Utilisez la voix ou le texte pour poser vos questions"}
        </p>
      </div>
    </div>
  );
}

function LoadingMessage({ language }: { language: Language }) {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-teal-100 flex items-center justify-center overflow-hidden shadow-md">
        <img
          src="/logo1.png"
          alt="Mo7ami"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="loading-dot w-2 h-2 bg-primary-600 rounded-full"></div>
          <div className="loading-dot w-2 h-2 bg-primary-600 rounded-full"></div>
          <div className="loading-dot w-2 h-2 bg-primary-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
