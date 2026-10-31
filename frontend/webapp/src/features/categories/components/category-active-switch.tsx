"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";

import { setCategoryActiveAction } from "../actions/set-category-active";
import { useCategoriesBySearchCacheManagement } from "../api/client";
import { CATEGORY_TRANSLATION_KEY } from "../constants";

/**
 * The category's own on/off switch (category.categories.is_active). Saves immediately, on its
 * own, so it does not depend on the rest of the form. Not the same as "show on landing page":
 * that only hides an active category from the landing shelf; this takes it off the whole site.
 */
export function CategoryActiveSwitch({
  categoryId,
  initialActive,
}: {
  categoryId: string;
  initialActive: boolean;
}) {
  const t = useTranslations(CATEGORY_TRANSLATION_KEY);
  const router = useRouter();
  const { invalidateAllCache } = useCategoriesBySearchCacheManagement();
  const [isActive, setIsActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();

  const onChange = (next: boolean) => {
    const previous = isActive;
    setIsActive(next);
    startTransition(async () => {
      const result = await setCategoryActiveAction({ categoryId, isActive: next });
      if (result.ok === false) {
        setIsActive(previous);
        toast.error(
          "code" in result && result.code === "PARENT_INACTIVE" ? t("activeSwitch.parentInactive") : t("activeSwitch.failed"),
        );
        return;
      }
      toast.success(next ? t("activeSwitch.activated") : t("activeSwitch.deactivated"));
      invalidateAllCache();
      router.refresh();
    });
  };

  return (
    <div
      className={
        "flex items-start justify-between gap-4 rounded-xl border p-4 " +
        (isActive ? "bg-muted/20" : "border-destructive/40 bg-destructive/5")
      }
    >
      <div className="space-y-1">
        <label htmlFor="category-active-switch" className="text-sm font-semibold">
          {t("activeSwitch.label")}
          <span className={"ms-2 text-xs font-normal " + (isActive ? "text-emerald-600" : "text-destructive")}>
            {isActive ? t("status.active") : t("status.inactive")}
          </span>
        </label>
        <p className="text-xs text-muted-foreground">{t("activeSwitch.description")}</p>
      </div>
      <Switch
        id="category-active-switch"
        checked={isActive}
        disabled={isPending}
        onCheckedChange={onChange}
        data-testid="category-active-switch"
      />
    </div>
  );
}
