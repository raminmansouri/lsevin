"use client";

import { CountryCode, parsePhoneNumberWithError } from "libphonenumber-js";
import { Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { TRANSLATION_KEY } from "../../types/constants";

type ServiceProviderCallSectionProps = {
  phoneNumberCountryCode?: string;
  phoneNumber?: string;
};
const ServiceProviderCallSection = ({
  phoneNumberCountryCode,
  phoneNumber,
}: ServiceProviderCallSectionProps) => {
  const t = useTranslations(TRANSLATION_KEY);

  const handleCall = () => {
    if (phoneNumberCountryCode && phoneNumber) {
      try {
        const formattedPhoneNumber = parsePhoneNumberWithError(
          phoneNumber,
          phoneNumberCountryCode as CountryCode
        );
        window.location.href = `tel:${formattedPhoneNumber.formatInternational()}`;
      } catch (error) {
        console.error("Error formatting phone number:", error);
        // Fallback to basic format if parsing fails
        window.location.href = `tel:+${phoneNumberCountryCode}${phoneNumber}`;
      }
    }
  };
  if (!phoneNumberCountryCode || !phoneNumber) {
    return null;
  }

  return (
    <Button onClick={handleCall} className="w-full" size="lg">
      <Phone className="me-2 h-4 w-4" />
      {t("contactProvider")}
    </Button>
  );
};

export default ServiceProviderCallSection;
