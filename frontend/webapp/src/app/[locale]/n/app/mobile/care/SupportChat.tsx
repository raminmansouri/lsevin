"use client";

import { useTranslations } from "next-intl";

export default function SupportChat() {
  const t = useTranslations("SupportPages.mobileSupport");
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t("chatTitle")}</h1>
    </div>
  );
}
