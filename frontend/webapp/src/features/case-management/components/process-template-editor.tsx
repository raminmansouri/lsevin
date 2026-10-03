"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import type { ProcessTemplateDetail } from "../server/admin-repository";
import { createProcessTemplateVersionAction } from "../server/template-actions";

type EditableStep = ProcessTemplateDetail["steps"][number];
const emptyStep = (): EditableStep => ({
  id: crypto.randomUUID(),
  stepKey: `step_${Date.now()}`,
  displayOrder: 0,
  titleTranslations: { en: "", fa: "", ar: "" },
  descriptionTranslations: { en: "", fa: "", ar: "" },
  timingAnchor: "previous_step",
  offsetMinutes: 0,
  estimatedDurationMinutes: null,
  responsibleRole: "provider",
  customerVisible: true,
  providerVisible: true,
  adminVisible: true,
  requiresManualCompletion: true,
});

export function ProcessTemplateEditor({
  template,
  readOnly,
}: {
  template: ProcessTemplateDetail;
  readOnly: boolean;
}) {
  const t = useTranslations("CaseManagement.templateEditor");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [names, setNames] = useState({
    en: template.nameTranslations.en ?? "",
    fa:
      template.nameTranslations.fa ?? template.nameTranslations["fa-IR"] ?? "",
    ar: template.nameTranslations.ar ?? "",
  });
  const [descriptions, setDescriptions] = useState({
    en: template.descriptionTranslations.en ?? "",
    fa:
      template.descriptionTranslations.fa ??
      template.descriptionTranslations["fa-IR"] ??
      "",
    ar: template.descriptionTranslations.ar ?? "",
  });
  const [steps, setSteps] = useState(template.steps);

  const changeStep = (index: number, patch: Partial<EditableStep>) =>
    setSteps((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...patch } : step
      )
    );
  const move = (index: number, delta: number) =>
    setSteps((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const save = () =>
    startTransition(async () => {
      const result = await createProcessTemplateVersionAction({
        templateId: template.id,
        expectedVersion: template.version,
        nameTranslations: names,
        descriptionTranslations: descriptions,
        steps: steps.map(({ id: _id, displayOrder: _order, ...step }) => step),
      });
      if ("error" in result) {
        toast.error(t(`errors.${result.error}`));
        if (result.error === "stale") router.refresh();
        return;
      }
      toast.success(t("saved"));
      router.push(`/admin/case-templates/${result.templateId}`);
      router.refresh();
    });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>{t("identity")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {(["fa", "en", "ar"] as const).map((locale) => (
            <div key={locale} className="space-y-2">
              <Label>{t(`name.${locale}`)}</Label>
              <Input
                value={names[locale]}
                disabled={readOnly || pending}
                onChange={(event) =>
                  setNames((value) => ({
                    ...value,
                    [locale]: event.target.value,
                  }))
                }
              />
              <Textarea
                value={descriptions[locale]}
                disabled={readOnly || pending}
                placeholder={t(`description.${locale}`)}
                onChange={(event) =>
                  setDescriptions((value) => ({
                    ...value,
                    [locale]: event.target.value,
                  }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={step.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">
                {t("stepNumber", { number: index + 1 })}
              </CardTitle>
              {!readOnly && (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={pending || index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={t("moveUp")}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={pending || index === steps.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={t("moveDown")}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={pending || steps.length === 1}
                    onClick={() =>
                      setSteps((items) =>
                        items.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                    aria-label={t("removeStep")}
                  >
                    <Trash2 className="size-4 text-red-600" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("stepKey")}</Label>
                <Input
                  value={step.stepKey}
                  disabled={readOnly || pending}
                  dir="ltr"
                  onChange={(event) =>
                    changeStep(index, {
                      stepKey: event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "_"),
                    })
                  }
                />
              </div>
              {(["fa", "en", "ar"] as const).map((locale) => (
                <div key={locale} className="space-y-2">
                  <Label>{t(`title.${locale}`)}</Label>
                  <Input
                    value={step.titleTranslations[locale] ?? ""}
                    disabled={readOnly || pending}
                    onChange={(event) =>
                      changeStep(index, {
                        titleTranslations: {
                          ...step.titleTranslations,
                          [locale]: event.target.value,
                        },
                      })
                    }
                  />
                </div>
              ))}
              {(["fa", "en", "ar"] as const).map((locale) => (
                <div key={`description-${locale}`} className="space-y-2">
                  <Label>{t(`stepDescription.${locale}`)}</Label>
                  <Textarea
                    value={step.descriptionTranslations[locale] ?? ""}
                    disabled={readOnly || pending}
                    onChange={(event) =>
                      changeStep(index, {
                        descriptionTranslations: {
                          ...step.descriptionTranslations,
                          [locale]: event.target.value,
                        },
                      })
                    }
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label>{t("responsibleRole")}</Label>
                <select
                  className="bg-background h-9 w-full rounded-md border px-3 text-sm"
                  disabled={readOnly || pending}
                  value={step.responsibleRole}
                  onChange={(event) =>
                    changeStep(index, { responsibleRole: event.target.value })
                  }
                >
                  {["customer", "provider", "staff", "admin", "system"].map(
                    (role) => (
                      <option key={role} value={role}>
                        {t(`roles.${role}`)}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("timingAnchor")}</Label>
                <select
                  className="bg-background h-9 w-full rounded-md border px-3 text-sm"
                  disabled={readOnly || pending}
                  value={step.timingAnchor}
                  onChange={(event) =>
                    changeStep(index, { timingAnchor: event.target.value })
                  }
                >
                  {[
                    "booking_created",
                    "appointment_start",
                    "appointment_end",
                    "previous_step",
                  ].map((anchor) => (
                    <option key={anchor} value={anchor}>
                      {t(`anchors.${anchor}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("offsetMinutes")}</Label>
                <Input
                  type="number"
                  value={step.offsetMinutes}
                  disabled={readOnly || pending}
                  onChange={(event) =>
                    changeStep(index, {
                      offsetMinutes: Number(event.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("durationMinutes")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={step.estimatedDurationMinutes ?? ""}
                  disabled={readOnly || pending}
                  onChange={(event) =>
                    changeStep(index, {
                      estimatedDurationMinutes:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    })
                  }
                />
              </div>
              <div className="flex flex-wrap items-end gap-4 md:col-span-2">
                {(
                  [
                    "customerVisible",
                    "providerVisible",
                    "adminVisible",
                    "requiresManualCompletion",
                  ] as const
                ).map((field) => (
                  <label
                    key={field}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={step[field]}
                      disabled={readOnly || pending}
                      onChange={(event) =>
                        changeStep(index, { [field]: event.target.checked })
                      }
                    />
                    {t(field)}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap justify-between gap-3">
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => setSteps((items) => [...items, emptyStep()])}
          >
            <Plus className="me-2 size-4" />
            {t("addStep")}
          </Button>
          <Button disabled={pending || steps.length === 0} onClick={save}>
            {t("publishVersion", { version: template.version + 1 })}
          </Button>
        </div>
      )}
    </div>
  );
}
