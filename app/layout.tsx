import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

// Note: Using system fonts for Arabic until custom fonts are added
// See FONTS_SETUP.md for instructions on adding Tajawal font

export const metadata: Metadata = {
  title: "Mo7ami | محامي - Your Legal Assistant",
  description: "Educational AI-powered legal chatbot for Moroccan law. Ask questions in Arabic (Darija) or French and get authoritative answers with citations.",
  keywords: ["Morocco", "law", "legal", "chatbot", "Arabic", "French", "Darija", "محامي", "قانون"],
  authors: [{ name: "Mo7ami Team" }],
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/logo1.png',
  },
  openGraph: {
    title: "Mo7ami | محامي - Your Legal Assistant",
    description: "Educational AI-powered legal chatbot for Moroccan law",
    type: "website",
    locale: "ar_MA",
    alternateLocale: ["fr_FR"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
