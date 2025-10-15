"use client";

import Link from "next/link";
import { MessageSquare, Mic, Shield, BookOpen, ArrowRight, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { LegalDomainsSimple } from "@/components/home/LegalDomainsSimple";
import { useRouter } from "next/navigation";

// Rotating questions for each language (changes every 5 seconds)
const QUESTION_SETS = {
  ar: [
    [
      "شنو كايقول القانون الجنائي على السرقة؟",
      "واش عندي الحق نطلب الطلاق؟",
      "كيفاش نسجل شركة جديدة؟"
    ],
    [
      "شنو هي حقوق العامل في المغرب؟",
      "كيفاش نقدم شكاية للبوليس؟",
      "واش كاينة عقوبة على التشهير؟"
    ],
    [
      "شنو هي إجراءات الإرث في المغرب؟",
      "كيفاش نحمي العلامة التجارية ديالي؟",
      "واش يمكن ليا نسترجع الفلوس ديالي من شي منتوج خايب؟"
    ],
    [
      "شنو هي حقوق المستهلك في المغرب؟",
      "كيفاش نخرج من عقد الكراء؟",
      "واش عندي الحق نطلب تعويض من الضمان الاجتماعي؟"
    ]
  ],
  fr: [
    [
      "Que dit le code pénal sur le vol?",
      "Ai-je le droit de demander le divorce?",
      "Comment enregistrer une nouvelle entreprise?"
    ],
    [
      "Quels sont les droits des employés au Maroc?",
      "Comment déposer une plainte à la police?",
      "Y a-t-il une sanction pour la diffamation?"
    ],
    [
      "Quelles sont les procédures de succession?",
      "Comment protéger ma marque commerciale?",
      "Puis-je récupérer mon argent d'un produit défectueux?"
    ],
    [
      "Quels sont les droits des consommateurs?",
      "Comment résilier un contrat de bail?",
      "Ai-je droit à une indemnisation de la CNSS?"
    ]
  ],
  tz: [
    [
      "ⵎⴰⵏⴰⵢⴰ ⵉⵜⵜⵉⵏⵉ ⵓⵏⵥⴰⵕ ⵅⴼ ⵜⴰⴽⴽⵔⴰⴼⵜ?",
      "ⵎⴰⵏⴰⵢⴰ ⵉⵜⵜⵉⵏⵉ ⵓⵏⵥⴰⵕ ⵅⴼ ⵜⴰⵡⵙⴰⵔⵜ?",
      "ⵎⴰⵎⴽ ⴰⴷ ⵙⵙⴽⵔⵖ ⵜⴰⵙⵇⵇⵉⵎⵜ?"
    ],
    [
      "ⵎⴰⵏⴰⵢⴰ ⵉⴳⴰⵏ ⵉⵣⵔⴼⴰⵏ ⵏ ⵓⵎⵙⵡⵓⵔⵉ?",
      "ⵎⴰⵎⴽ ⴰⴷ ⵙⵙⴽⵔⵖ ⴰⵙⵏⵎⴰⵍⴰ?",
      "ⵎⴰⵏⴰⵢⴰ ⵉⴳⴰⵏ ⵉⵣⵔⴼⴰⵏ ⵏ ⵜⵎⵙⵏⵉⵡⵉⵏ?"
    ],
    [
      "ⵎⴰⵎⴽ ⴰⴷ ⵃⴹⵓⵖ ⵜⴰⵎⴰⵜⴰⵔⵜ ⵏ ⵜⵙⵇⵇⵉⵎⵜ?",
      "ⵎⴰⵏⴰⵢⴰ ⵉⴳⴰⵏ ⵉⵣⵔⴼⴰⵏ ⵏ ⵜⵡⵙⴰⵔⵜ?",
      "ⵎⴰⵎⴽ ⴰⴷ ⵙⵙⵉⵡⴹⵖ ⴰⵙⵏⵓⴱⴳ ⵏ ⵜⴽⵔⴰⵢⵜ?"
    ],
    [
      "ⵎⴰⵏⴰⵢⴰ ⵉⴳⴰⵏ ⵉⵣⵔⴼⴰⵏ ⵏ ⵓⵙⵙⵎⵔⵙ?",
      "ⵎⴰⵎⴽ ⴰⴷ ⴼⴼⵖⵖ ⵙⴳ ⵓⵙⵏⵓⴱⴳ?",
      "ⵎⴰⵏⴰⵢⴰ ⵉⴳⴰⵏ ⵉⵣⵔⴼⴰⵏ ⵏ ⵜⵡⵓⵔⵉⵡⵉⵏ?"
    ]
  ]
};

export default function HomePage() {
  const router = useRouter();
  const [currentQuestionSet, setCurrentQuestionSet] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState<'ar' | 'fr' | 'tz'>('ar');

  // Rotate questions every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuestionSet((prev) => (prev + 1) % QUESTION_SETS[currentLanguage].length);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentLanguage]);

  const currentQuestions = QUESTION_SETS[currentLanguage][currentQuestionSet];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Plain Background - Consistent with Chat Page */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-teal-50/20"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Compact Language Selector */}
        <div className="container-luxury pt-3">
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => setCurrentLanguage('ar')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentLanguage === 'ar'
                  ? 'bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-md'
                  : 'glass-card text-gray-700 hover:bg-white/90'
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => setCurrentLanguage('fr')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentLanguage === 'fr'
                  ? 'bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-md'
                  : 'glass-card text-gray-700 hover:bg-white/90'
              }`}
            >
              Français
            </button>
            <button
              onClick={() => setCurrentLanguage('tz')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentLanguage === 'tz'
                  ? 'bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-md'
                  : 'glass-card text-gray-700 hover:bg-white/90'
              }`}
            >
              ⵜⴰⵎⴰⵣⵉⵖⵜ
            </button>
          </div>
        </div>

        {/* Hero Section - Vertically Compact with Maximum Text Visibility */}
        <div className="container-luxury py-3 lg:py-4">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo - Current Size Maintained */}
            <div className="mb-2 flex justify-center">
              <img
                src="/logo1.png"
                alt="Mo7ami Logo"
                className="w-64 h-64 md:w-80 md:h-80 lg:w-[24rem] lg:h-[24rem] object-contain drop-shadow-lg"
              />
            </div>

            {/* Enhanced Title - Maximum Visibility & Prominence */}
            <div className="mb-3">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-1.5 tracking-tight leading-tight">
                {currentLanguage === 'ar' && 'محامي'}
                {currentLanguage === 'fr' && 'Mo7ami'}
                {currentLanguage === 'tz' && 'ⴰⵎⴰⵢⵏⴰⵙ'}
              </h1>
              <p className="text-xl sm:text-2xl lg:text-3xl text-teal-700 font-bold leading-tight">
                {currentLanguage === 'ar' && 'مساعدك القانوني الذكي'}
                {currentLanguage === 'fr' && 'Votre assistant juridique intelligent'}
                {currentLanguage === 'tz' && 'ⴰⵎⵙⵡⵓⵔⵉ ⵏⵏⴽ ⵏ ⵓⵏⵥⴰⵕ'}
              </p>
            </div>

            {/* Enhanced Description - Maximum Readability & Prominence */}
            <div className="mb-4 max-w-4xl mx-auto">
              <p className="text-lg sm:text-xl text-gray-800 font-medium leading-snug">
                {currentLanguage === 'ar' && 'اسأل عن القانون المغربي بالدارجة أو الأمازيغية أو الفرنسية واحصل على إجابات دقيقة'}
                {currentLanguage === 'fr' && 'Posez des questions sur le droit marocain et obtenez des réponses précises avec des références officielles'}
                {currentLanguage === 'tz' && 'ⵙⵙⵇⵙⴰ ⵅⴰⴼ ⵓⵏⵥⴰⵕ ⴰⵎⵖⵔⵉⴱⵉ ⵙ ⵜⴷⴰⵔⵉⵊⵜ ⵏⵖ ⵜⴰⵎⴰⵣⵉⵖⵜ'}
              </p>
            </div>

            {/* Refined CTA Buttons - Tighter Spacing */}
            <div className="mb-5 flex flex-col sm:flex-row gap-2.5 justify-center items-center">
              <Link
                href="/chat"
                className="group btn-luxury bg-gradient-to-r from-teal-700 to-teal-600 text-white hover:from-teal-800 hover:to-teal-700 flex items-center gap-2.5 px-8 py-3"
              >
                {currentLanguage === 'ar' && 'ابدأ المحادثة'}
                {currentLanguage === 'fr' && 'Commencer'}
                {currentLanguage === 'tz' && 'ⴱⴷⵓ ⴷⵖⵉ'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/auth/signin"
                className="btn-luxury glass-card text-teal-700 hover:bg-white/90 flex items-center gap-2 px-6 py-3"
              >
                <Users className="w-4 h-4" />
                {currentLanguage === 'ar' && 'تسجيل الدخول'}
                {currentLanguage === 'fr' && 'Se connecter'}
                {currentLanguage === 'tz' && 'ⴽⵛⵎ'}
              </Link>
            </div>

            {/* Legal Domains - Simple Grey */}
            <LegalDomainsSimple
              language={currentLanguage === 'tz' ? 'fr' : currentLanguage as "ar" | "fr"}
            />

            {/* Compact Example Questions */}
            <div className="mb-10">
              <h3 className="text-base font-semibold text-gray-700 mb-4">
                {currentLanguage === 'ar' && 'أمثلة على الأسئلة:'}
                {currentLanguage === 'fr' && 'Exemples de questions:'}
                {currentLanguage === 'tz' && 'ⵉⵎⴷⵢⴰⵜⵏ ⵏ ⵉⵙⵇⵙⵉⵜⵏ:'}
              </h3>
              <div className="grid gap-2.5 max-w-3xl mx-auto">
                {currentQuestions.map((question, i) => {
                  const targetLang = currentLanguage === 'fr' ? 'fr' : 'ar';
                  return (
                    <Link
                      key={`${currentQuestionSet}-${i}`}
                      href={`/chat?prompt=${encodeURIComponent(question)}&lang=${targetLang}`}
                      className="glass-card p-3.5 hover:bg-white/90 hover:border-teal-500/30 transition-all cursor-pointer animate-fade-in group"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <p className="text-sm text-gray-700 group-hover:text-teal-700 transition-colors">{question}</p>
                    </Link>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-gray-500 flex items-center justify-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 bg-teal-600 rounded-full animate-pulse"></span>
                {currentLanguage === 'ar' && 'تتغير الأسئلة تلقائياً كل 5 ثواني'}
                {currentLanguage === 'fr' && 'Les questions changent toutes les 5 secondes'}
                {currentLanguage === 'tz' && 'ⵜⵜⵎⵙⵙⵉⵏⵜⵏ ⵜⵙⵇⵙⵉⵜⵉⵏ'}
              </p>
            </div>

            {/* Compact Features Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <FeatureCard
                icon={<Mic className="w-8 h-8" />}
                title={currentLanguage === 'ar' ? 'تفاعل صوتي' : currentLanguage === 'fr' ? 'Interaction vocale' : 'ⴰⵎⵙⴰⵡⴰⵍ ⵙ ⵉⵎⵙⵍⵉ'}
                description={currentLanguage === 'ar' ? 'اسأل بصوتك واستمع للإجابة' : currentLanguage === 'fr' ? 'Parlez et écoutez les réponses' : 'ⵙⵙⵇⵙⴰ ⵙ ⵉⵎⵙⵍⵉ ⵏⵏⴽ'}
              />
              <FeatureCard
                icon={<MessageSquare className="w-8 h-8" />}
                title={currentLanguage === 'ar' ? '3 لغات' : currentLanguage === 'fr' ? '3 langues' : '3 ⵜⵓⵜⵍⴰⵢⵉⵏ'}
                description={currentLanguage === 'ar' ? 'العربية، الأمازيغية، الفرنسية' : currentLanguage === 'fr' ? 'Arabe, Amazigh, Français' : 'ⵜⴰⵄⵔⴰⴱⵜ، ⵜⴰⵎⴰⵣⵉⵖⵜ، ⵜⴰⴼⵕⴰⵏⵙⵉⵙⵜ'}
              />
              <FeatureCard
                icon={<Shield className="w-8 h-8" />}
                title={currentLanguage === 'ar' ? 'مراجع رسمية' : currentLanguage === 'fr' ? 'Sources officielles' : 'ⵉⵙⵓⵖⴰⵍ ⵓⵏⵚⵉⴱⵏ'}
                description={currentLanguage === 'ar' ? 'الجريدة الرسمية المغربية' : currentLanguage === 'fr' ? 'Bulletin Officiel du Maroc' : 'ⴰⵖⵎⵉⵙ ⵓⵏⵚⵉⴱ'}
              />
              <FeatureCard
                icon={<BookOpen className="w-8 h-8" />}
                title={currentLanguage === 'ar' ? '12+ مجال' : currentLanguage === 'fr' ? '12+ domaines' : '12+ ⵉⴳⵔⴰⵏ'}
                description={currentLanguage === 'ar' ? 'جنائي، مدني، أسري، عمل...' : currentLanguage === 'fr' ? 'Pénal, civil, famille, travail...' : 'ⴰⵣⵔⴼⴰⵏ، ⵜⴰⵡⵙⴰⵔⵜ، ⵜⴰⵡⵓⵔⵉ...'}
              />
            </div>

            {/* Compact Legal Disclaimers */}
            <div className="max-w-4xl mx-auto space-y-3">
              {/* Primary Disclaimer */}
              <div className="glass-card p-4">
                <div className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    {currentLanguage === 'ar' && (
                      <>
                        <p className="text-xs font-semibold text-gray-800 mb-1.5">تنبيه قانوني مهم</p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          محامي منصة <strong>تعليمية</strong> توفر معلومات قانونية عامة فقط. لا نقدم استشارات قانونية مهنية.
                          خاضعة للقانون المغربي رقم <strong>09-08</strong>.
                        </p>
                      </>
                    )}
                    {currentLanguage === 'fr' && (
                      <>
                        <p className="text-xs font-semibold text-gray-800 mb-1.5">Avertissement légal</p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Mo7ami est une plateforme <strong>éducative</strong>. Nous ne fournissons pas de conseils juridiques professionnels.
                          Conforme à la loi marocaine n° <strong>09-08</strong>.
                        </p>
                      </>
                    )}
                    {currentLanguage === 'tz' && (
                      <>
                        <p className="text-xs font-semibold text-gray-800 mb-1.5">ⴰⵍⵖⵓ ⵏ ⵓⵏⵥⴰⵕ</p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          ⴰⵎⴰⵢⵏⴰⵙ ⵉⴳⴰ ⵜⴰⵏⴼⵍⵉⵜ ⵏ ⵓⵙⵙⵍⵎⴷ. ⴰⵏⵥⴰⵕ 09-08.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Message */}
              <div className="p-3.5 bg-gradient-to-r from-teal-50 to-teal-50/50 border border-teal-200/50 rounded-xl">
                <div className="text-center">
                  {currentLanguage === 'ar' && (
                    <>
                      <p className="text-sm font-semibold text-gray-800 mb-1">نحو وعي قانوني أفضل</p>
                      <p className="text-xs text-gray-600">
                        معرفة حقوقك القانونية خطوة نحو مجتمع أكثر وعياً.
                      </p>
                    </>
                  )}
                  {currentLanguage === 'fr' && (
                    <>
                      <p className="text-sm font-semibold text-gray-800 mb-1">Pour une meilleure conscience juridique</p>
                      <p className="text-xs text-gray-600">
                        Connaître vos droits est la clé d'une société plus juste.
                      </p>
                    </>
                  )}
                  {currentLanguage === 'tz' && (
                    <>
                      <p className="text-sm font-semibold text-gray-800 mb-1">ⵖⵔ ⵜⴰⵏⴰⴼⵓⵜ ⵜⴰⵏⵥⴰⴹⵜ</p>
                      <p className="text-xs text-gray-600">
                        ⴰⵙⵙⵏ ⵏ ⵉⵣⵔⴼⴰⵏ ⵏⵏⴽ ⵉⴳⴰ ⵜⴰⵙⵓⵜⵍⵜ.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* When to Consult */}
              <div className="p-3 bg-slate-50/80 border border-slate-200/50 rounded-lg">
                <p className="text-xs text-gray-700">
                  {currentLanguage === 'ar' && (
                    <>
                      <strong>متى يجب استشارة محامٍ؟</strong> عند مواجهة قضية قانونية أو نزاع قضائي.
                      <a href="https://www.justice.gov.ma" className="underline text-teal-700 hover:text-teal-800 ml-1" target="_blank" rel="noopener">وزارة العدل</a>
                    </>
                  )}
                  {currentLanguage === 'fr' && (
                    <>
                      <strong>Quand consulter un avocat?</strong> En cas de litige ou procédure judiciaire.
                      <a href="https://www.justice.gov.ma" className="underline text-teal-700 hover:text-teal-800 ml-1" target="_blank" rel="noopener">Ministère de la Justice</a>
                    </>
                  )}
                  {currentLanguage === 'tz' && (
                    <>
                      <strong>ⵎⴰⵎⴽ ⴰⴷ ⵜⵙⵙⵇⵙⴰⴷ ⴰⵎⴰⵢⵏⴰⵙ?</strong> ⵎⴽ ⵜⵍⵍⴰⴷ ⵜⵓⴳⵜ ⵜⴰⵏⵥⴰⴹⵜ.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Footer */}
        <footer className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-6 mt-12">
          <div className="container-luxury text-center">
            <p className="text-xs opacity-90 mb-2.5">
              {currentLanguage === 'ar' && '© 2024 محامي - مبادرة لرفع الوعي القانوني'}
              {currentLanguage === 'fr' && '© 2024 Mo7ami - Initiative pour la conscience juridique'}
              {currentLanguage === 'tz' && '© 2024 ⴰⵎⴰⵢⵏⴰⵙ'}
            </p>
            <div className="flex justify-center gap-4 text-xs">
              <a href="https://www.sgg.gov.ma" target="_blank" rel="noopener" className="hover:text-teal-300 transition-colors">
                {currentLanguage === 'ar' && 'الأمانة العامة'}
                {currentLanguage === 'fr' && 'SGG'}
                {currentLanguage === 'tz' && 'SGG'}
              </a>
              <span className="opacity-50">•</span>
              <a href="https://www.justice.gov.ma" target="_blank" rel="noopener" className="hover:text-teal-300 transition-colors">
                {currentLanguage === 'ar' && 'وزارة العدل'}
                {currentLanguage === 'fr' && 'Min. Justice'}
                {currentLanguage === 'tz' && 'ⵜⴰⵏⴱⴰⴹⵜ'}
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card p-4 hover:bg-white/90 transition-all group">
      <div className="text-teal-700 mb-2 flex justify-center group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="font-semibold text-gray-800 mb-1.5 text-sm">{title}</h3>
      <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
