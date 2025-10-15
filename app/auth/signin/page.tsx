"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/chat" });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 py-10">
      <div className="max-w-md w-full p-6 md:p-8">
        <div className="text-center mb-6">
          {/* Mo7ami Logo - Real Logo Instead of SVG */}
          <div className="mb-5 flex justify-center">
            <div className="w-28 h-28 md:w-32 md:h-32 bg-white rounded-2xl shadow-xl border-2 border-teal-100 flex items-center justify-center overflow-hidden p-2">
              <img
                src="/logo1.png"
                alt="Mo7ami Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-1.5">محامي Mo7ami</h1>
          <p className="text-gray-600">مساعدك القانوني الذكي</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-7">
          <h2 className="text-xl font-semibold text-gray-800 mb-5 text-center">
            تسجيل الدخول
          </h2>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl font-medium text-gray-700 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>{isLoading ? "جاري التحميل..." : "تسجيل الدخول بواسطة Google"}</span>
          </button>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-600">
              ليس لديك حساب؟ سيتم إنشاؤه تلقائياً عند تسجيل الدخول
            </p>
          </div>
        </div>

        {/* Anonymous Access */}
        <div className="mt-5 text-center">
          <p className="text-sm text-gray-600 mb-3">أو</p>
          <Link
            href="/chat"
            className="inline-block px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
          >
            المتابعة بدون حساب
          </Link>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-gray-700 text-center">
            بتسجيل الدخول، أنت توافق على{" "}
            <Link href="/privacy" className="underline text-teal-700">
              سياسة الخصوصية
            </Link>{" "}
            و{" "}
            <Link href="/terms" className="underline text-teal-700">
              شروط الاستخدام
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-5 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-teal-700">
            ← العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
