export type Language = "ar" | "fr" | "tz";

export function detectLanguage(text: string): Language {
  // Check for Tifinagh/Tamazight characters
  const tifinaqhPattern = /[\u2D30-\u2D7F]/;
  const hasTifinagh = tifinaqhPattern.test(text);

  // Check for Arabic characters (including Darija which uses Arabic script)
  const arabicPattern = /[\u0600-\u06FF]/;
  const hasArabic = arabicPattern.test(text);

  // Check for French/Latin characters
  const latinPattern = /[a-zA-ZÀ-ÿ]/;
  const hasLatin = latinPattern.test(text);

  // Priority: Tifinagh > Arabic > French
  if (hasTifinagh) return "tz";

  // If both Arabic and Latin exist, count occurrences
  if (hasArabic && hasLatin) {
    const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const latinCount = (text.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
    return arabicCount > latinCount ? "ar" : "fr";
  }

  // Return based on presence
  return hasArabic ? "ar" : "fr";
}

export function getDirection(language: Language): "rtl" | "ltr" {
  return language === "ar" ? "rtl" : "ltr";
}

export function getLanguageLabel(language: Language): string {
  switch (language) {
    case "ar":
      return "العربية";
    case "tz":
      return "ⵜⴰⵎⴰⵣⵉⵖⵜ";
    case "fr":
    default:
      return "Français";
  }
}
