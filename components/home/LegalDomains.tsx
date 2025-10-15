"use client";

import { Scale, Briefcase, Home, Users, Building2, FileText, Gavel, Receipt, Shield, Car, Database, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LegalDomain {
  id: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const legalDomains: LegalDomain[] = [
  {
    id: "penal",
    nameAr: "القانون الجنائي",
    nameFr: "Droit Pénal",
    nameEn: "Criminal Law",
    icon: <Gavel className="w-6 h-6" />,
    color: "text-red-600",
    gradient: "from-red-500 to-red-600"
  },
  {
    id: "civil",
    nameAr: "القانون المدني",
    nameFr: "Droit Civil",
    nameEn: "Civil Law",
    icon: <Scale className="w-6 h-6" />,
    color: "text-blue-600",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    id: "family",
    nameAr: "قانون الأسرة",
    nameFr: "Droit de la Famille",
    nameEn: "Family Law",
    icon: <Users className="w-6 h-6" />,
    color: "text-pink-600",
    gradient: "from-pink-500 to-pink-600"
  },
  {
    id: "labor",
    nameAr: "قانون الشغل",
    nameFr: "Droit du Travail",
    nameEn: "Labor Law",
    icon: <Briefcase className="w-6 h-6" />,
    color: "text-orange-600",
    gradient: "from-orange-500 to-orange-600"
  },
  {
    id: "commercial",
    nameAr: "القانون التجاري",
    nameFr: "Droit Commercial",
    nameEn: "Commercial Law",
    icon: <Building2 className="w-6 h-6" />,
    color: "text-purple-600",
    gradient: "from-purple-500 to-purple-600"
  },
  {
    id: "real-estate",
    nameAr: "القانون العقاري",
    nameFr: "Droit Immobilier",
    nameEn: "Real Estate Law",
    icon: <Home className="w-6 h-6" />,
    color: "text-green-600",
    gradient: "from-green-500 to-green-600"
  },
  {
    id: "administrative",
    nameAr: "القانون الإداري",
    nameFr: "Droit Administratif",
    nameEn: "Administrative Law",
    icon: <FileText className="w-6 h-6" />,
    color: "text-indigo-600",
    gradient: "from-indigo-500 to-indigo-600"
  },
  {
    id: "tax",
    nameAr: "القانون الضريبي",
    nameFr: "Droit Fiscal",
    nameEn: "Tax Law",
    icon: <Receipt className="w-6 h-6" />,
    color: "text-yellow-600",
    gradient: "from-yellow-500 to-yellow-600"
  },
  {
    id: "consumer",
    nameAr: "حماية المستهلك",
    nameFr: "Protection du Consommateur",
    nameEn: "Consumer Protection",
    icon: <ShoppingBag className="w-6 h-6" />,
    color: "text-teal-600",
    gradient: "from-teal-500 to-teal-600"
  },
  {
    id: "data",
    nameAr: "حماية البيانات",
    nameFr: "Protection des Données",
    nameEn: "Data Protection",
    icon: <Database className="w-6 h-6" />,
    color: "text-cyan-600",
    gradient: "from-cyan-500 to-cyan-600"
  },
  {
    id: "traffic",
    nameAr: "قانون السير",
    nameFr: "Code de la Route",
    nameEn: "Traffic Law",
    icon: <Car className="w-6 h-6" />,
    color: "text-gray-600",
    gradient: "from-gray-500 to-gray-600"
  },
  {
    id: "privacy",
    nameAr: "الخصوصية",
    nameFr: "Vie Privée",
    nameEn: "Privacy",
    icon: <Shield className="w-6 h-6" />,
    color: "text-emerald-600",
    gradient: "from-emerald-500 to-emerald-600"
  }
];

interface LegalDomainsProps {
  language?: "ar" | "fr" | "en";
  onDomainClick?: (domain: LegalDomain) => void;
}

export function LegalDomains({ language = "fr", onDomainClick }: LegalDomainsProps) {
  const isArabic = language === "ar";

  const getDomainName = (domain: LegalDomain) => {
    switch (language) {
      case "ar":
        return domain.nameAr;
      case "en":
        return domain.nameEn;
      default:
        return domain.nameFr;
    }
  };

  return (
    <div className="w-full py-12">
      <h2 className={cn(
        "text-2xl font-bold text-center mb-8 text-gray-800",
        isArabic && "font-arabic"
      )}>
        {isArabic ? "مجالات القانون المغربي" : "Domaines du Droit Marocain"}
      </h2>

      {/* Desktop Grid */}
      <div className="hidden lg:grid grid-cols-6 gap-6 px-8">
        {legalDomains.map((domain) => (
          <button
            key={domain.id}
            onClick={() => onDomainClick?.(domain)}
            className="group relative"
          >
            <div className={cn(
              "w-28 h-28 rounded-full bg-gradient-to-br flex flex-col items-center justify-center",
              "transform transition-all duration-300 hover:scale-110 hover:shadow-xl",
              "cursor-pointer border-2 border-white shadow-lg",
              `${domain.gradient}`
            )}>
              <div className="text-white mb-1">{domain.icon}</div>
              <span className="text-xs text-white font-medium text-center px-2 leading-tight">
                {getDomainName(domain)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Tablet Grid */}
      <div className="hidden md:grid lg:hidden grid-cols-4 gap-6 px-6">
        {legalDomains.map((domain) => (
          <button
            key={domain.id}
            onClick={() => onDomainClick?.(domain)}
            className="group relative"
          >
            <div className={cn(
              "w-24 h-24 rounded-full bg-gradient-to-br flex flex-col items-center justify-center",
              "transform transition-all duration-300 hover:scale-110 hover:shadow-xl",
              "cursor-pointer border-2 border-white shadow-lg",
              `${domain.gradient}`
            )}>
              <div className="text-white mb-1">{domain.icon}</div>
              <span className="text-[10px] text-white font-medium text-center px-1 leading-tight">
                {getDomainName(domain)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Mobile Grid */}
      <div className="grid md:hidden grid-cols-3 gap-4 px-4">
        {legalDomains.map((domain) => (
          <button
            key={domain.id}
            onClick={() => onDomainClick?.(domain)}
            className="group relative"
          >
            <div className={cn(
              "w-20 h-20 rounded-full bg-gradient-to-br flex flex-col items-center justify-center",
              "transform transition-all duration-300 active:scale-95",
              "cursor-pointer border-2 border-white shadow-md",
              `${domain.gradient}`
            )}>
              <div className="text-white scale-75">{domain.icon}</div>
              <span className="text-[9px] text-white font-medium text-center px-1 leading-tight">
                {getDomainName(domain)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Subtitle */}
      <p className={cn(
        "text-center text-sm text-gray-500 mt-6",
        isArabic && "font-arabic"
      )}>
        {isArabic
          ? "اختر مجال القانون الذي تريد استكشافه"
          : "Sélectionnez un domaine juridique à explorer"}
      </p>
    </div>
  );
}