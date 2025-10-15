"use client";

import { MessageSquare, User, LogOut, Settings, Plus, Clock } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { Language } from "@/lib/utils/language";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  language: Language;
  timestamp: Date;
}

interface ChatHeaderProps {
  onHistoryClick: () => void;
  language: Language;
  messages: Message[];
  onNewChat: () => void;
  showHistory: boolean;
}

export function ChatHeader({ onHistoryClick, language, messages, onNewChat, showHistory }: ChatHeaderProps) {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isArabic = language === "ar";

  return (
    <header className="glass-card border-b px-3 py-1.5 relative">
      <div className="flex items-center justify-between">
        {/* Left side - Compact */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo1.png"
              alt="Mo7ami Logo"
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-lg font-bold bg-gradient-to-r from-teal-700 to-teal-600 bg-clip-text text-transparent">
              {isArabic ? "محامي" : "Mo7ami"}
            </h1>
          </Link>

          {/* Compact History button */}
          <button
            onClick={onHistoryClick}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium",
              showHistory
                ? "bg-teal-100 text-teal-700 shadow-sm"
                : "hover:bg-gray-100 text-gray-700"
            )}
            title={isArabic ? "سجل المحادثات" : "Historique"}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden md:inline">
              {isArabic ? "السجل" : "Historique"}
            </span>
            {messages.length > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                showHistory ? "bg-teal-200 text-teal-800" : "bg-gray-200 text-gray-700"
              )}>
                {messages.length}
              </span>
            )}
          </button>

          {/* Compact New chat button */}
          {messages.length > 0 && (
            <button
              onClick={onNewChat}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-lg transition-all text-xs font-medium shadow-sm"
              title={isArabic ? "محادثة جديدة" : "Nouvelle conversation"}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {isArabic ? "جديد" : "Nouveau"}
              </span>
            </button>
          )}
        </div>

        {/* Right side - Compact */}
        <div className="flex items-center gap-2">
          {session ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-7 h-7 rounded-full ring-2 ring-teal-100"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-teal-600" />
                  </div>
                )}
                <span className="text-xs font-medium text-gray-700 hidden md:block max-w-[100px] truncate">
                  {session.user.name}
                </span>
              </button>

              {/* Compact User dropdown menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-48 glass-card rounded-lg py-1.5 z-20">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-3.5 h-3.5 text-gray-600" />
                      <span className={cn("text-xs", isArabic && "font-arabic")}>
                        {isArabic ? "الإعدادات" : "Paramètres"}
                      </span>
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-red-600"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className={cn("text-xs", isArabic && "font-arabic")}>
                        {isArabic ? "تسجيل الخروج" : "Se déconnecter"}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all text-xs font-medium shadow-sm"
            >
              {isArabic ? "تسجيل الدخول" : "Se connecter"}
            </Link>
          )}
        </div>
      </div>

      {/* Compact History Dropdown */}
      {showHistory && messages.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={onHistoryClick}
          />
          <div className={cn(
            "absolute top-full mt-1.5 w-80 max-h-96 glass-card rounded-lg overflow-hidden z-20",
            isArabic ? "right-3" : "left-3"
          )}>
            <div className="p-3 border-b border-gray-200/50 bg-gradient-to-r from-teal-50/50 to-transparent">
              <h3 className="font-semibold text-gray-900 text-sm">
                {isArabic ? "سجل المحادثة" : "Historique"}
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {messages.length} {isArabic ? "رسالة" : "messages"}
              </p>
            </div>
            <div className="overflow-y-auto max-h-80 p-2 space-y-1.5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "p-2.5 rounded-lg text-xs",
                    message.role === "user"
                      ? "bg-teal-50/70 border border-teal-200/50"
                      : "bg-gray-50/70 border border-gray-200/50"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-medium text-gray-600">
                      {message.role === "user"
                        ? (isArabic ? "أنت" : "Vous")
                        : (isArabic ? "محامي" : "Mo7ami")}
                    </span>
                    <div className="flex items-center gap-0.5 text-[10px] text-gray-400">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{getTimeAgo(message.timestamp, language)}</span>
                    </div>
                  </div>
                  <p className={cn(
                    "text-gray-700 line-clamp-2 whitespace-pre-wrap leading-relaxed",
                    isArabic && "text-right"
                  )}>
                    {message.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

function getTimeAgo(date: Date, language: Language): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (language === "ar") {
    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  } else {
    if (diffMins < 1) return "maintenant";
    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    return `il y a ${diffDays}j`;
  }
}
