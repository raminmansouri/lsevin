"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";

import { setCategoryPriorityAction } from "../../actions/set-category-priority";
import { CATEGORY_TRANSLATION_KEY, MAX_CATEGORY_PRIORITY } from "../../constants";
import { CategoryListItem } from "../../types/category";
import { parsePriorityInput } from "../../utils/priority";

/**
 * Inline priority editor for one category row: saves on blur or Enter, Escape restores the saved
 * value. Empty (or 0) removes the priority. The row keeps showing the last saved value on failure.
 */
export function CategoryPriorityInput({ category }: { category: CategoryListItem }) {
  const t = useTranslations(CATEGORY_TRANSLATION_KEY);
  const saved = category.displayOrder && category.displayOrder > 0 ? String(category.displayOrder) : "";
  const [committed, setCommitted] = useState(saved);
  const [value, setValue] = useState(saved);
  const [invalid, setInvalid] = useState(false);
  const [pending, startTransition] = useTransition();

  // A refreshed list (router.refresh) brings the server's value; follow it unless mid-edit.
  useEffect(() => {
    setCommitted(saved);
    setValue(saved);
  }, [saved]);

  const commit = () => {
    if (value.trim() === committed) {
      setInvalid(false);
      return;
    }
    const parsed = parsePriorityInput(value, MAX_CATEGORY_PRIORITY);
    if (!parsed.ok) {
      setInvalid(true);
      toast.error(t("homepage.invalid", { max: MAX_CATEGORY_PRIORITY }));
      return;
    }
    setInvalid(false);
    const next = parsed.value > 0 ? String(parsed.value) : "";
    setValue(next);
    startTransition(async () => {
      const result = await setCategoryPriorityAction({ categoryId: category.categoryId, priority: parsed.value });
      // `in` rather than `result.ok` narrowing: this project compiles with strict off, where
      // boolean-literal discriminants do not narrow.
      if (!("code" in result)) {
        setCommitted(next);
        toast.success(t(next ? "homepage.saved" : "homepage.cleared", { name: category.name }));
      } else {
        setValue(committed);
        toast.error(result.code === "INVALID" ? t("homepage.invalid", { max: MAX_CATEGORY_PRIORITY }) : t("homepage.failed"));
      }
    });
  };

  return (
    <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
      <Input
        type="text"
        inputMode="numeric"
        dir="ltr"
        value={value}
        placeholder="—"
        disabled={pending}
        aria-label={t("homepage.priorityLabel", { name: category.name })}
        aria-invalid={invalid || undefined}
        data-testid={`category-priority-${category.categoryId}`}
        className={`h-9 w-20 text-center ${invalid ? "border-destructive" : ""}`}
        onChange={(event) => {
          setValue(event.target.value);
          if (invalid) setInvalid(false);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") {
            setValue(committed);
            setInvalid(false);
          }
        }}
      />
      {pending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label={t("homepage.saving")} /> : null}
    </div>
  );
}
