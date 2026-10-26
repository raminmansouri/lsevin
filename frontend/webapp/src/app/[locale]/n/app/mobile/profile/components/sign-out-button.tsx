"use client";

import React from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

import { clearOfflineProfile } from "@/lib/pwa/offline-profile";

export default function SignOutButton() {
  const t = useTranslations("MobileProfile.common");

  return (
    <>
      <button
        onClick={() => {
          clearOfflineProfile();
          void signOut();
        }}
        className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-red-600 transition hover:shadow-md"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
          <LogOut size={20} />
        </div>
        <span className="flex-1 text-left font-medium">{t("logOut")}</span>
      </button>
    </>
  );
}
