"use client";

import { Info, Users, Layers, FileText } from "lucide-react";
import { useTranslations } from "next-intl";

export function ProjectInfo() {
  const t = useTranslations("components.projectInfo");

  return (
    <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
      <div className="flex items-center gap-2 mb-3">
        <Info size={18} className="text-[#083f30]" />
        <h3 className="font-semibold text-[#083f30]">{t("project")}</h3>
      </div>

      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-[#eacb7f]" />
          <span>{t("userRoles")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-[#eacb7f]" />
          <span>{t("coreStages")}</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-[#eacb7f]" />
          <span>{t("screens")}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t text-xs text-gray-500">
        <strong>{t("brandLabel")}</strong> #083f30 / #eacb7f
      </div>
    </div>
  );
}
