"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { User, Globe, Volume2, Moon, Save } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [language, setLanguage] = useState<"ar" | "fr">("ar");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoPlayVoice, setAutoPlayVoice] = useState(true);
  const [voiceGender, setVoiceGender] = useState<"male" | "female">("female");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isSaving, setIsSaving] = useState(false);

  const isArabic = language === "ar";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Save preferences to backend
    setTimeout(() => {
      setIsSaving(false);
      alert(isArabic ? "تم حفظ الإعدادات" : "Paramètres enregistrés");
    }, 1000);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {isArabic ? "جاري التحميل..." : "Chargement..."}
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8" dir={isArabic ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/chat" className="text-primary-600 hover:text-primary-700">
            ← {isArabic ? "العودة إلى المحادثة" : "Retour au chat"}
          </Link>
          <h1 className={cn("text-2xl font-bold", isArabic && "font-arabic")}>
            {isArabic ? "الإعدادات" : "Paramètres"}
          </h1>
          <div className="w-20" /> {/* Spacer for center alignment */}
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-5 md:p-6">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-5">
          <div className="flex items-center gap-3">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-10 h-10 text-primary-600" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {session.user.name}
              </h2>
              <p className="text-gray-600">{session.user.email}</p>
            </div>
          </div>
        </div>

        {/* Language Preference */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-primary-600" />
            <h3 className={cn("text-xl font-bold", isArabic && "font-arabic")}>
              {isArabic ? "اللغة المفضلة" : "Langue préférée"}
            </h3>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="language"
                value="ar"
                checked={language === "ar"}
                onChange={(e) => setLanguage(e.target.value as "ar" | "fr")}
                className="w-5 h-5 text-primary-600"
              />
              <span className="font-arabic text-lg">العربية (Arabe)</span>
            </label>
            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="language"
                value="fr"
                checked={language === "fr"}
                onChange={(e) => setLanguage(e.target.value as "ar" | "fr")}
                className="w-5 h-5 text-primary-600"
              />
              <span className="text-lg">Français (French)</span>
            </label>
          </div>
        </div>

        {/* Voice Settings */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <Volume2 className="w-6 h-6 text-primary-600" />
            <h3 className={cn("text-xl font-bold", isArabic && "font-arabic")}>
              {isArabic ? "إعدادات الصوت" : "Paramètres vocaux"}
            </h3>
          </div>

          <div className="space-y-4">
            {/* Enable Voice */}
            <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <span className={cn("font-medium", isArabic && "font-arabic")}>
                {isArabic ? "تفعيل الصوت" : "Activer la voix"}
              </span>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded"
              />
            </label>

            {/* Auto-play Voice */}
            <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <span className={cn("font-medium", isArabic && "font-arabic")}>
                {isArabic ? "تشغيل تلقائي للإجابات" : "Lecture auto des réponses"}
              </span>
              <input
                type="checkbox"
                checked={autoPlayVoice}
                onChange={(e) => setAutoPlayVoice(e.target.checked)}
                disabled={!voiceEnabled}
                className="w-5 h-5 text-primary-600 rounded disabled:opacity-50"
              />
            </label>

            {/* Voice Gender */}
            <div>
              <label
                className={cn(
                  "block mb-2 font-medium",
                  isArabic && "font-arabic"
                )}
              >
                {isArabic ? "نوع الصوت" : "Type de voix"}
              </label>
              <div className="flex gap-3">
                <label className="flex-1 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="voice"
                    value="female"
                    checked={voiceGender === "female"}
                    onChange={(e) =>
                      setVoiceGender(e.target.value as "male" | "female")
                    }
                    disabled={!voiceEnabled}
                    className="mr-2"
                  />
                  <span className={isArabic ? "font-arabic" : ""}>
                    {isArabic ? "أنثى" : "Féminin"}
                  </span>
                </label>
                <label className="flex-1 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="voice"
                    value="male"
                    checked={voiceGender === "male"}
                    onChange={(e) =>
                      setVoiceGender(e.target.value as "male" | "female")
                    }
                    disabled={!voiceEnabled}
                    className="mr-2"
                  />
                  <span className={isArabic ? "font-arabic" : ""}>
                    {isArabic ? "ذكر" : "Masculin"}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Theme (Coming Soon) */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-5 opacity-50">
          <div className="flex items-center gap-3 mb-4">
            <Moon className="w-6 h-6 text-primary-600" />
            <h3 className={cn("text-xl font-bold", isArabic && "font-arabic")}>
              {isArabic ? "المظهر" : "Thème"}
            </h3>
            <span className="text-sm text-gray-500">
              ({isArabic ? "قريباً" : "Bientôt"})
            </span>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-2.5 px-5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-base md:text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span className={isArabic ? "font-arabic" : ""}>
                {isArabic ? "حفظ الإعدادات" : "Enregistrer"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
