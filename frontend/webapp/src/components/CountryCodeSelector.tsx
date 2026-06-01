"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";

export interface CountryCode {
  code: string;
  name: string;
  dial: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "TR", name: "Turkey", dial: "+90", flag: "🇹🇷" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "IR", name: "Iran", dial: "+98", flag: "🇮🇷" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "RU", name: "Russia", dial: "+7", flag: "🇷🇺" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬" },
  { code: "JO", name: "Jordan", dial: "+962", flag: "🇯🇴" },
  { code: "LB", name: "Lebanon", dial: "+961", flag: "🇱🇧" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { code: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦" },
  { code: "OM", name: "Oman", dial: "+968", flag: "🇴🇲" },
  { code: "BH", name: "Bahrain", dial: "+973", flag: "🇧🇭" },
  { code: "IQ", name: "Iraq", dial: "+964", flag: "🇮🇶" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
];

interface CountryCodeSelectorProps {
  value: CountryCode;
  onChange: (country: CountryCode) => void;
  className?: string;
}

export function CountryCodeSelector({ value, onChange, className = "" }: CountryCodeSelectorProps) {
  const t = useTranslations("components.countryCodeSelector");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const countryNames = useMemo(
    () => ({
      AE: t("countries.AE"),
      SA: t("countries.SA"),
      TR: t("countries.TR"),
      US: t("countries.US"),
      GB: t("countries.GB"),
      IR: t("countries.IR"),
      DE: t("countries.DE"),
      FR: t("countries.FR"),
      RU: t("countries.RU"),
      EG: t("countries.EG"),
      JO: t("countries.JO"),
      LB: t("countries.LB"),
      KW: t("countries.KW"),
      QA: t("countries.QA"),
      OM: t("countries.OM"),
      BH: t("countries.BH"),
      IQ: t("countries.IQ"),
      IN: t("countries.IN"),
      PK: t("countries.PK"),
      CN: t("countries.CN"),
    }),
    [t],
  );

  const countries = useMemo(
    () =>
      COUNTRY_CODES.map((country) => ({
        ...country,
        localizedName: countryNames[country.code as keyof typeof countryNames] || country.name,
      })),
    [countryNames],
  );

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredCountries = countries.filter((country) => {
    if (!normalizedSearchQuery) return true;
    return (
      country.localizedName.toLowerCase().includes(normalizedSearchQuery) ||
      country.name.toLowerCase().includes(normalizedSearchQuery) ||
      country.dial.includes(normalizedSearchQuery) ||
      country.code.toLowerCase().includes(normalizedSearchQuery)
    );
  });

  const selectedCountryName = countries.find((country) => country.code === value.code)?.localizedName || value.name;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-100 transition"
        aria-label={t("selectedCountry", { country: selectedCountryName, dial: value.dial })}
      >
        <span className="text-2xl">{value.flag}</span>
        <span className="font-medium text-gray-900">{value.dial}</span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-80 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                />
              </div>
            </div>

            <div className="overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onChange(country);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition text-left ${
                    value.code === country.code ? "bg-[#083f30]/5" : ""
                  }`}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{country.localizedName}</div>
                  </div>
                  <div className="font-semibold text-gray-700">{country.dial}</div>
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="p-4 text-center text-gray-500">{t("noCountriesFound")}</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export { COUNTRY_CODES };
