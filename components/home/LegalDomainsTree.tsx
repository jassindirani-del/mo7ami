"use client";

import { Scale, Briefcase, Home, Users, Building2, FileText, Gavel, Receipt, Shield, Car, Database, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useRouter } from "next/navigation";

interface LegalDomain {
  id: string;
  nameAr: string;
  nameFr: string;
  icon: React.ReactNode;
  gradient: string;
  position: { x: number; y: number };
  size: "large" | "medium" | "small";
}

const legalDomains: LegalDomain[] = [
  // Top Center - Main
  {
    id: "penal",
    nameAr: "القانون الجنائي",
    nameFr: "Droit Pénal",
    icon: <Gavel className="w-7 h-7" />,
    gradient: "from-red-500 to-red-600",
    position: { x: 50, y: 5 },
    size: "large"
  },

  // Second Row - 2 items
  {
    id: "civil",
    nameAr: "القانون المدني",
    nameFr: "Droit Civil",
    icon: <Scale className="w-6 h-6" />,
    gradient: "from-blue-500 to-blue-600",
    position: { x: 30, y: 20 },
    size: "medium"
  },
  {
    id: "family",
    nameAr: "قانون الأسرة",
    nameFr: "Droit de la Famille",
    icon: <Users className="w-6 h-6" />,
    gradient: "from-pink-500 to-pink-600",
    position: { x: 70, y: 20 },
    size: "medium"
  },

  // Third Row - 3 items
  {
    id: "labor",
    nameAr: "قانون الشغل",
    nameFr: "Droit du Travail",
    icon: <Briefcase className="w-5 h-5" />,
    gradient: "from-orange-500 to-orange-600",
    position: { x: 20, y: 38 },
    size: "medium"
  },
  {
    id: "commercial",
    nameAr: "القانون التجاري",
    nameFr: "Droit Commercial",
    icon: <Building2 className="w-5 h-5" />,
    gradient: "from-purple-500 to-purple-600",
    position: { x: 50, y: 38 },
    size: "medium"
  },
  {
    id: "real-estate",
    nameAr: "القانون العقاري",
    nameFr: "Droit Immobilier",
    icon: <Home className="w-5 h-5" />,
    gradient: "from-green-500 to-green-600",
    position: { x: 80, y: 38 },
    size: "medium"
  },

  // Fourth Row - 3 items
  {
    id: "administrative",
    nameAr: "القانون الإداري",
    nameFr: "Droit Administratif",
    icon: <FileText className="w-5 h-5" />,
    gradient: "from-indigo-500 to-indigo-600",
    position: { x: 20, y: 56 },
    size: "small"
  },
  {
    id: "tax",
    nameAr: "القانون الضريبي",
    nameFr: "Droit Fiscal",
    icon: <Receipt className="w-5 h-5" />,
    gradient: "from-yellow-500 to-yellow-600",
    position: { x: 50, y: 56 },
    size: "small"
  },
  {
    id: "consumer",
    nameAr: "حماية المستهلك",
    nameFr: "Protection du Consommateur",
    icon: <ShoppingBag className="w-5 h-5" />,
    gradient: "from-teal-500 to-teal-600",
    position: { x: 80, y: 56 },
    size: "small"
  },

  // Fifth Row - 3 items
  {
    id: "privacy",
    nameAr: "الخصوصية",
    nameFr: "Vie Privée",
    icon: <Shield className="w-5 h-5" />,
    gradient: "from-emerald-500 to-emerald-600",
    position: { x: 30, y: 74 },
    size: "small"
  },
  {
    id: "traffic",
    nameAr: "قانون السير",
    nameFr: "Code de la Route",
    icon: <Car className="w-5 h-5" />,
    gradient: "from-gray-500 to-gray-600",
    position: { x: 50, y: 74 },
    size: "small"
  },
  {
    id: "data",
    nameAr: "حماية البيانات",
    nameFr: "Protection des Données",
    icon: <Database className="w-5 h-5" />,
    gradient: "from-cyan-500 to-cyan-600",
    position: { x: 70, y: 74 },
    size: "small"
  }
];

interface LegalDomainsTreeProps {
  language?: "ar" | "fr" | "en" | "tz";
}

export function LegalDomainsTree({ language = "fr" }: LegalDomainsTreeProps) {
  const router = useRouter();
  const isArabic = language === "ar";

  const getDomainName = (domain: LegalDomain) => {
    return isArabic ? domain.nameAr : domain.nameFr;
  };

  const getSize = (size: string) => {
    switch (size) {
      case "large":
        return "w-32 h-32 md:w-36 md:h-36";
      case "medium":
        return "w-24 h-24 md:w-28 md:h-28";
      case "small":
        return "w-20 h-20 md:w-24 md:h-24";
      default:
        return "w-24 h-24";
    }
  };

  const getFontSize = (size: string) => {
    switch (size) {
      case "large":
        return "text-xs md:text-sm";
      case "medium":
        return "text-[10px] md:text-xs";
      case "small":
        return "text-[9px] md:text-[10px]";
      default:
        return "text-xs";
    }
  };

  const handleDomainClick = (domain: LegalDomain) => {
    router.push(`/chat?domain=${domain.id}&lang=${language}`);
  };

  return (
    <div className="w-full py-8 md:py-12 overflow-hidden">
      <h2 className={cn(
        "text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-gray-800",
        isArabic && "font-arabic"
      )}>
        {isArabic ? "مجالات القانون المغربي" : "Domaines du Droit Marocain"}
      </h2>

      {/* Tree Container - Desktop */}
      <div className="hidden md:block relative h-[500px] max-w-6xl mx-auto">
        {/* Connection Lines SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {/* Lines from top to second row */}
          <line x1="50%" y1="15%" x2="30%" y2="25%" stroke="#e5e7eb" strokeWidth="2" />
          <line x1="50%" y1="15%" x2="70%" y2="25%" stroke="#e5e7eb" strokeWidth="2" />

          {/* Lines from second to third row */}
          <line x1="30%" y1="30%" x2="20%" y2="43%" stroke="#e5e7eb" strokeWidth="1.5" />
          <line x1="30%" y1="30%" x2="50%" y2="43%" stroke="#e5e7eb" strokeWidth="1.5" />
          <line x1="70%" y1="30%" x2="50%" y2="43%" stroke="#e5e7eb" strokeWidth="1.5" />
          <line x1="70%" y1="30%" x2="80%" y2="43%" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Lines from third to fourth row */}
          <line x1="20%" y1="48%" x2="20%" y2="60%" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="50%" y1="48%" x2="50%" y2="60%" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="80%" y1="48%" x2="80%" y2="60%" stroke="#e5e7eb" strokeWidth="1" />

          {/* Lines from fourth to fifth row */}
          <line x1="20%" y1="66%" x2="30%" y2="78%" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="50%" y1="66%" x2="50%" y2="78%" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="80%" y1="66%" x2="70%" y2="78%" stroke="#e5e7eb" strokeWidth="1" />
        </svg>

        {/* Domain Circles */}
        {legalDomains.map((domain) => (
          <button
            key={domain.id}
            onClick={() => handleDomainClick(domain)}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 hover:z-10",
              "flex flex-col items-center justify-center rounded-full",
              "bg-gradient-to-br border-4 border-white shadow-lg cursor-pointer",
              getSize(domain.size),
              domain.gradient
            )}
            style={{
              left: `${domain.position.x}%`,
              top: `${domain.position.y}%`,
              zIndex: 1
            }}
          >
            <div className="text-white mb-1">{domain.icon}</div>
            <span className={cn(
              "text-white font-semibold text-center px-2 leading-tight",
              getFontSize(domain.size)
            )}>
              {getDomainName(domain)}
            </span>
          </button>
        ))}
      </div>

      {/* Mobile Grid - Simpler Layout */}
      <div className="md:hidden px-4">
        <div className="grid grid-cols-3 gap-4">
          {legalDomains.slice(0, 9).map((domain) => (
            <button
              key={domain.id}
              onClick={() => handleDomainClick(domain)}
              className={cn(
                "w-full aspect-square rounded-full",
                "bg-gradient-to-br border-2 border-white shadow-md",
                "flex flex-col items-center justify-center",
                "active:scale-95 transition-transform",
                domain.gradient
              )}
            >
              <div className="text-white scale-75 mb-1">{domain.icon}</div>
              <span className="text-[9px] text-white font-medium text-center px-1 leading-tight">
                {getDomainName(domain)}
              </span>
            </button>
          ))}
        </div>

        {/* Remaining items in a centered row */}
        <div className="flex justify-center gap-4 mt-4">
          {legalDomains.slice(9).map((domain) => (
            <button
              key={domain.id}
              onClick={() => handleDomainClick(domain)}
              className={cn(
                "w-20 h-20 rounded-full",
                "bg-gradient-to-br border-2 border-white shadow-md",
                "flex flex-col items-center justify-center",
                "active:scale-95 transition-transform",
                domain.gradient
              )}
            >
              <div className="text-white scale-75 mb-1">{domain.icon}</div>
              <span className="text-[9px] text-white font-medium text-center px-1 leading-tight">
                {getDomainName(domain)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Subtitle */}
      <p className={cn(
        "text-center text-sm text-gray-500 mt-8",
        isArabic && "font-arabic"
      )}>
        {isArabic
          ? "اختر مجال القانون للبدء"
          : "Sélectionnez un domaine pour commencer"}
      </p>
    </div>
  );
}