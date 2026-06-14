"use client";

import { useState, useTransition } from "react";
import { Edit, FileText, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { LexicalRenderer } from "@/components/editor/lexical-renderer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { localeToHeader } from "@/config/locales";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import {
  createEmptyLocalizedContent,
  getLocalizedValue,
  normalizeLocalizedFields,
} from "@/features/shared/utils/localization";
import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";
import { LocaleTypes } from "@/types/common";

import { addProviderPolicy } from "../../../actions/add-provider-policy";
import { removeProviderPolicy } from "../../../actions/remove-provider-policy";
import { updateProviderPolicyAction } from "../../../actions/update-provider-policy";
import { ServiceProviderPolicy } from "../../../types";
import { TRANSLATION_KEY } from "../../../types/constants";

function localizedContentHasValue(value: { translations?: Record<string, unknown> }) {
  return Object.values(value.translations || {}).some((item) => {
    const raw = String(item || "").trim();
    if (!raw) return false;

    try {
      const parsed = JSON.parse(raw) as any;
      const root = parsed?.root;
      if (!root || !Array.isArray(root.children)) return raw.length > 0;

      const walk = (nodes: any[]): boolean =>
        nodes.some((node) => {
          if (typeof node?.text === "string" && node.text.trim()) return true;
          if (Array.isArray(node?.children)) return walk(node.children);
          return false;
        });

      return walk(root.children);
    } catch {
      return raw.length > 0;
    }
  });
}

interface ServiceProviderPolicyManagerProps {
  serviceProviderId: string;
  currentPolicies?: ServiceProviderPolicy[];
  onUpdate?: () => void;
}

export default function ServiceProviderPolicyManager({
  serviceProviderId,
  currentPolicies = [],
  onUpdate,
}: ServiceProviderPolicyManagerProps) {
  const t = useTranslations(TRANSLATION_KEY);
  const locale = useLocale();
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);

  // Form state for new policy
  const [newPolicy, setNewPolicy] = useState({
    type: createEmptyLocalizedContent(),
    description: createEmptyLocalizedContent(),
  });

  // Edit state management
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    policyId: "",
    type: createEmptyLocalizedContent(),
    description: createEmptyLocalizedContent(),
  });

  const { execute: executeAdd } = useAction(addProviderPolicy, {
    startTransition,
    onSuccess: () => {
      toast.success(t("policies.messages.addSuccess"));
      setIsAdding(false);
      setNewPolicy({
        type: createEmptyLocalizedContent(),
        description: createEmptyLocalizedContent(),
      });
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("policies.messages.addError"));
    },
  });

  const { execute: executeRemove } = useAction(removeProviderPolicy, {
    startTransition,
    onSuccess: () => {
      toast.success(t("policies.messages.removeSuccess"));
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("policies.messages.removeError"));
    },
  });

  const { execute: executeUpdate } = useAction(updateProviderPolicyAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("policies.messages.updateSuccess"));
      setEditingId(null);
      setEditFormData({
        policyId: "",
        type: createEmptyLocalizedContent(),
        description: createEmptyLocalizedContent(),
      });
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("policies.messages.updateError"));
    },
  });

  const [ConfirmDialog, confirm] = useConfirm(
    t("policies.removeDialog.title"),
    t("policies.removeDialog.description")
  );

  const handleAdd = () => {
    // Normalize localized content
    const normalizedFields = normalizeLocalizedFields({
      type: newPolicy.type,
      description: newPolicy.description,
    });

    // Validate that both fields have at least one translation
    const hasType = localizedContentHasValue(normalizedFields.type);
    const hasDescription = localizedContentHasValue(normalizedFields.description);

    if (!hasType) {
      toast.error(t("policies.messages.typeRequired"));
      return;
    }

    if (!hasDescription) {
      toast.error(t("policies.messages.descriptionRequired"));
      return;
    }

    executeAdd({
      serviceProviderId,
      type: normalizedFields.type,
      description: normalizedFields.description,
    });
  };

  const handleRemove = async (policy: ServiceProviderPolicy) => {
    const ok = await confirm();
    if (ok) {
      executeRemove({
        serviceProviderId,
        policyId: policy.id,
      });
    }
  };

  const handleEditClick = (policy: ServiceProviderPolicy) => {
    setEditingId(policy.id);
    setEditFormData({
      policyId: policy.id,
      type: policy.type,
      description: policy.description,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({
      policyId: "",
      type: createEmptyLocalizedContent(),
      description: createEmptyLocalizedContent(),
    });
  };

  const handleUpdatePolicy = () => {
    // Normalize localized fields
    const normalizedFields = normalizeLocalizedFields({
      type: editFormData.type,
      description: editFormData.description,
    });

    // Validate that both fields have at least one translation
    const hasType = localizedContentHasValue(normalizedFields.type);
    const hasDescription = localizedContentHasValue(normalizedFields.description);

    if (!hasType) {
      toast.error(t("policies.messages.typeRequired"));
      return;
    }

    if (!hasDescription) {
      toast.error(t("policies.messages.descriptionRequired"));
      return;
    }

    executeUpdate({
      serviceProviderId,
      policyId: editFormData.policyId,
      type: normalizedFields.type,
      description: normalizedFields.description,
    });
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("policies.title")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("policies.description")}
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          disabled={isPending || isAdding}
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("policies.actions.add")}
        </Button>
      </div>

      {/* Existing policies */}
      <div className="grid gap-3">
        {currentPolicies.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-muted-foreground text-center">
                <FileText className="mx-auto mb-2 h-8 w-8" />
                <p>{t("policies.noPolicies")}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          currentPolicies.map((policy) => (
            <Card key={policy.id}>
              <CardContent className="pt-4">
                {editingId === policy.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {getLocalizedValue(policy.type, localeHeader)}
                      </h4>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          {t("policies.form.type")}
                          <span className="text-destructive ml-1">*</span>
                        </Label>
                        <LocalizedInput
                          value={editFormData.type}
                          onChange={(value) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              type: value,
                            }))
                          }
                          label={t("policies.form.typePlaceholder")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          {t("policies.form.description")}
                          <span className="text-destructive ml-1">*</span>
                        </Label>
                        <LocalizedInput
                          richText
                          value={editFormData.description}
                          onChange={(value) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              description: value,
                            }))
                          }
                          label={t("policies.form.descriptionPlaceholder")}
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isPending}
                        size="sm"
                      >
                        {t("policies.actions.cancel")}
                      </Button>
                      <Button
                        onClick={handleUpdatePolicy}
                        disabled={isPending}
                        size="sm"
                      >
                        {t("policies.actions.save")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="text-muted-foreground h-5 w-5" />
                        <h4 className="font-medium">
                          {getLocalizedValue(policy.type, localeHeader)}
                        </h4>
                      </div>
                      <div className="text-muted-foreground text-sm whitespace-pre-wrap">
                        <LexicalRenderer
                          content={getLocalizedValue(
                            policy.description,
                            localeHeader
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(policy)}
                        disabled={isPending || editingId !== null}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(policy)}
                        disabled={isPending || editingId !== null}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add policy form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("policies.add.title")}
            </CardTitle>
            <CardDescription>{t("policies.add.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("policies.form.type")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <LocalizedInput
                value={newPolicy.type}
                onChange={(value) =>
                  setNewPolicy((prev) => ({ ...prev, type: value }))
                }
                label={t("policies.form.typePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("policies.form.description")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <LocalizedInput
                richText
                value={newPolicy.description}
                onChange={(value) =>
                  setNewPolicy((prev) => ({ ...prev, description: value }))
                }
                label={t("policies.form.descriptionPlaceholder")}
                rows={6}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewPolicy({
                    type: createEmptyLocalizedContent(),
                    description: createEmptyLocalizedContent(),
                  });
                }}
                disabled={isPending}
              >
                {t("policies.actions.cancel")}
              </Button>
              <Button
                onClick={handleAdd}
                disabled={isPending}
              >
                {t("policies.actions.add")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog />
    </div>
  );
}
