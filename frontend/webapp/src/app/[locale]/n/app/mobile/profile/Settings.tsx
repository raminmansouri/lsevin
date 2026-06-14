"use client"

import { useTranslations } from 'next-intl';

export default function Settings() {
  const t = useTranslations("MobileProfile.settings");
  return <div className="p-6"><h1 className="text-2xl font-bold">{t("title")}</h1></div>;
}
