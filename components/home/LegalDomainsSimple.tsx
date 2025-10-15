"use client";

import { Scale, Briefcase, Home, Users, Building2, FileText, Gavel, Receipt, Shield, Car, Database, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useRouter } from "next/navigation";

interface LegalDomain {
  id: string;
  nameAr: string;
  nameFr: string;
  icon: React.ReactNode;
}

const legalDomains: LegalDomain[] = [
  {
    id: "penal",
    nameAr: "القانون الجنائي",
    nameFr: "Droit Pénal",
    icon: <Gavel className="w-6 h-6" />
  },
  {
    id: "civil",
    nameAr: "القانون المدني",
    nameFr: "Droit Civil",
    icon: <Scale className="w-6 h-6" />
  },
  {
    id: "family",
    nameAr: "قانون الأسرة",
    nameFr: "Droit de la Famille",
    icon: <Users className="w-6 h-6" />
  },
  {
    id: "labor",
    nameAr: "قانون الشغل",
    nameFr: "Droit du Travail",
    icon: <Briefcase className="w-6 h-6" />
  },
  {
    id: "commercial",
    nameAr: "القانون التجاري",
    nameFr: "Droit Commercial",
    icon: <Building2 className="w-6 h-6" />
  },
  {
    id: "real-estate",
    nameAr: "القانون العقاري",
    nameFr: "Droit Immobilier",
    icon: <Home className="w-6 h-6" />
  },
  {
    id: "administrative",
    nameAr: "القانون الإداري",
    nameFr: "Droit Administratif",
    icon: <FileText className="w-6 h-6" />
  },
  {
    id: "tax",
    nameAr: "القانون الضريبي",
    nameFr: "Droit Fiscal",
    icon: <Receipt className="w-6 h-6" />
  },
  {
    id: "consumer",
    nameAr: "حماية المستهلك",
    nameFr: "Protection du Consommateur",
    icon: <ShoppingBag className="w-6 h-6" />
  },
  {
    id: "privacy",
    nameAr: "الخصوصية",
    nameFr: "Vie Privée",
    icon: <Shield className="w-6 h-6" />
  },
  {
    id: "traffic",
    nameAr: "قانون السير",
    nameFr: "Code de la Route",
    icon: <Car className="w-6 h-6" />
  },
  {
    id: "data",
    nameAr: "حماية البيانات",
    nameFr: "Protection des Données",
    icon: <Database className="w-6 h-6" />
  }
];

interface LegalDomainsSimpleProps {
  language?: "ar" | "fr" | "en" | "tz";
}

export function LegalDomainsSimple({ language = "fr" }: LegalDomainsSimpleProps) {
  const router = useRouter();
  const isArabic = language === "ar";

  const getDomainName = (domain: LegalDomain) => {
    return isArabic ? domain.nameAr : domain.nameFr;
  };

  const handleDomainClick = (domain: LegalDomain) => {
    router.push(`/chat?domain=${domain.id}&lang=${language}`);
  };

  return (
    <div className="w-full py-8 md:py-12">
      <h2 className={cn(
        "text-2xl md:text-3xl font-bold text-center mb-8 md:mb-10 text-gray-800",
        isArabic && "font-arabic"
      )}>
        {isArabic ? "مجالات القانون المغربي" : "Domaines du Droit Marocain"}
      </h2>

      {/* Clean Grid Layout - All Grey */}
      <div className="max-w-5xl mx-auto px-4">
        {/* Desktop: 4 columns */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-8">
          {legalDomains.map((domain) => (
            <button
              key={domain.id}
              onClick={() => handleDomainClick(domain)}
              className="group flex flex-col items-center"
            >
              <div className="w-28 h-28 rounded-full bg-gray-100 border-2 border-gray-200
                            flex flex-col items-center justify-center
                            transition-all duration-300
                            hover:bg-gray-200 hover:border-gray-300 hover:shadow-lg hover:scale-105
                            group-hover:transform">
                <div className="text-gray-600 mb-1">{domain.icon}</div>
                <span className="text-xs text-gray-700 font-medium text-center px-2 leading-tight">
                  {getDomainName(domain)}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Tablet: 3 columns */}
        <div className="hidden md:grid lg:hidden md:grid-cols-3 gap-6">
          {legalDomains.map((domain) => (
            <button
              key={domain.id}
              onClick={() => handleDomainClick(domain)}
              className="group flex flex-col items-center"
            >
              <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200
                            flex flex-col items-center justify-center
                            transition-all duration-300
                            hover:bg-gray-200 hover:border-gray-300 hover:shadow-lg hover:scale-105">
                <div className="text-gray-600 mb-1 scale-90">{domain.icon}</div>
                <span className="text-[10px] text-gray-700 font-medium text-center px-1 leading-tight">
                  {getDomainName(domain)}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Mobile: 3 columns, smaller */}
        <div className="grid md:hidden grid-cols-3 gap-4">
          {legalDomains.map((domain) => (
            <button
              key={domain.id}
              onClick={() => handleDomainClick(domain)}
              className="group flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-full bg-gray-100 border border-gray-200
                            flex flex-col items-center justify-center
                            transition-all duration-200
                            active:bg-gray-200 active:scale-95">
                <div className="text-gray-600 scale-75">{domain.icon}</div>
                <span className="text-[9px] text-gray-700 font-medium text-center px-1 leading-tight">
                  {getDomainName(domain)}
                </span>
              </div>
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