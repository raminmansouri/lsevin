"use client";

import { useState, useTransition } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { SafeLexicalRenderer } from "./safe-lexical-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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

import { addServiceRequirementAction } from "../actions/add-service-requirement";
import { removeServiceRequirementAction } from "../actions/remove-service-requirement";
import { updateServiceRequirementAction } from "../actions/update-service-requirement";
import { SERVICE_DEFINITION_TRANSLATION_KEY } from "../constants";
import {
  ServiceDefinitionDetails,
  ServiceRequirement,
} from "../types/service-definition";

interface ServiceRequirementManagerProps {
  serviceDefinition: ServiceDefinitionDetails;
  onUpdate?: () => void;
}

export function ServiceRequirementManager({
  serviceDefinition,
  onUpdate,
}: ServiceRequirementManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const t = useTranslations(SERVICE_DEFINITION_TRANSLATION_KEY);

  // Simplified state management for the new requirement form
  const [newRequirement, setNewRequirement] = useState({
    description: createEmptyLocalizedContent(),
    isMandatory: false,
  });

  // Edit state management
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    description: createEmptyLocalizedContent(),
    isMandatory: false,
  });

  const { execute: executeAdd } = useAction(addServiceRequirementAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.requirementAddSuccess"));
      setIsAdding(false);
      setNewRequirement({
        description: createEmptyLocalizedContent(),
        isMandatory: false,
      });
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error.detail || t("messages.error"));
    },
  });

  const { execute: executeRemove } = useAction(removeServiceRequirementAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.requirementRemoveSuccess"));
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error.detail || t("messages.error"));
    },
  });

  const { execute: executeUpdate } = useAction(updateServiceRequirementAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.requirementUpdateSuccess"));
      setEditingIndex(null);
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error.detail || t("messages.error"));
    },
  });

  const [DeleteConfirmDialog, confirmDelete] = useConfirm(
    t("actions.removeRequirement"),
    t("actions.removeRequirementDescription"),
    "destructive"
  );

  const locale = useLocale();
  const localeHeader = localeToHeader(locale as LocaleTypes);

  const handleAddRequirement = async () => {
    // Basic validation
    const hasDescriptionTranslation = Object.values(
      newRequirement.description.translations
    ).some((t) => t?.trim());

    if (!hasDescriptionTranslation) {
      toast.error("Description is required");
      return;
    }

    // Normalize localized content
    const normalizedFields = normalizeLocalizedFields({
      description: newRequirement.description,
    });

    startTransition(async () => {
      await executeAdd({
        serviceDefinitionId: serviceDefinition.id,
        ...newRequirement,
        ...normalizedFields,
      });
    });
  };

  const handleRemoveRequirement = async (requirementId: number) => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;

    startTransition(async () => {
      await executeRemove({
        serviceDefinitionId: serviceDefinition.id,
        requirementIndex: requirementId,
      });
    });
  };

  const handleUpdateRequirement = async (requirementId: number) => {
    const hasDescriptionTranslation = Object.values(
      editFormData.description.translations
    ).some((t) => t?.trim());

    if (!hasDescriptionTranslation) {
      toast.error("Description is required");
      return;
    }

    const normalizedFields = normalizeLocalizedFields({
      description: editFormData.description,
    });

    startTransition(async () => {
      await executeUpdate({
        serviceDefinitionId: serviceDefinition.id,
        requirementIndex: requirementId,
        ...editFormData,
        ...normalizedFields,
      });
    });
  };

  const handleEditClick = (requirement: ServiceRequirement, index: number) => {
    setEditingIndex(index);
    setEditFormData({
      description: requirement.description,
      isMandatory: requirement.isMandatory,
    });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditFormData({
      description: createEmptyLocalizedContent(),
      isMandatory: false,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t("requirements.title")}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(!isAdding)}
              disabled={isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("requirements.addRequirement")}
            </Button>
          </CardTitle>
          <CardDescription>{t("requirements.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Existing Requirements List */}
          {serviceDefinition.requirements.length > 0 ? (
            <div className="space-y-3">
              {serviceDefinition.requirements.map((requirement, index) => (
                <div
                  key={requirement.id}
                  className="rounded-lg border p-4"
                >
                  {editingIndex === index ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <LocalizedInput
                          label={t("requirements.form.description.label")}
                          value={editFormData.description}
                          onChange={(value) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              description: value,
                            }))
                          }
                          richText
                          rows={3}
                          maxLength={2000}
                          required
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <label className="text-base font-medium">
                            {t("requirements.form.isMandatory")}
                          </label>
                          <div className="text-muted-foreground text-sm">
                            {t("requirements.form.isMandatoryDescription")}
                          </div>
                        </div>
                        <Switch
                          checked={editFormData.isMandatory}
                          onCheckedChange={(checked) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              isMandatory: checked,
                            }))
                          }
                          disabled={isPending}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdateRequirement(requirement.id)}
                          disabled={
                            isPending ||
                            !Object.values(
                              editFormData.description.translations
                            ).some((t) => t?.trim())
                          }
                          size="sm"
                        >
                          {isPending
                            ? t("requirements.form.updating")
                            : t("requirements.form.update")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isPending}
                          size="sm"
                        >
                          {t("form.cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <SafeLexicalRenderer
                              content={getLocalizedValue(
                                requirement.description,
                                localeHeader
                              )}
                            />
                          </div>
                          <Badge
                            variant={
                              requirement.isMandatory ? "default" : "secondary"
                            }
                          >
                            {requirement.isMandatory
                              ? t("requirements.mandatory")
                              : t("requirements.optional")}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(requirement, index)}
                          disabled={isPending || editingIndex !== null}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRequirement(requirement.id)}
                          disabled={isPending || editingIndex !== null}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center">
              {t("requirements.noRequirements")}
            </p>
          )}

          {/* Add New Requirement Form */}
          {isAdding && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{t("requirements.addNew")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Description Field */}
                  <div className="space-y-2">
                    <LocalizedInput
                      label={t("requirements.form.description.label")}
                      value={newRequirement.description}
                      onChange={(value) =>
                        setNewRequirement((prev) => ({
                          ...prev,
                          description: value,
                        }))
                      }
                      richText
                      rows={3}
                      maxLength={2000}
                      required
                    />
                  </div>

                  {/* Mandatory Toggle */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <label className="text-base font-medium">
                        {t("requirements.form.isMandatory")}
                      </label>
                      <div className="text-muted-foreground text-sm">
                        {t("requirements.form.isMandatoryDescription")}
                      </div>
                    </div>
                    <Switch
                      checked={newRequirement.isMandatory}
                      onCheckedChange={(checked) =>
                        setNewRequirement((prev) => ({
                          ...prev,
                          isMandatory: checked,
                        }))
                      }
                      disabled={isPending}
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddRequirement}
                      disabled={
                        isPending ||
                        !Object.values(
                          newRequirement.description.translations
                        ).some((t) => t?.trim())
                      }
                    >
                      {isPending
                        ? t("requirements.form.adding")
                        : t("requirements.form.add")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAdding(false);
                        setNewRequirement({
                          description: createEmptyLocalizedContent(),
                          isMandatory: false,
                        });
                      }}
                      disabled={isPending}
                    >
                      {t("form.cancel")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog />
    </div>
  );
}
