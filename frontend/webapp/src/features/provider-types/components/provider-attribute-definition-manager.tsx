"use client";

import { useState, useTransition } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AttributeType,
  attributeTypeSupportsOptions,
  getAttributeTypeOptions,
} from "@/features/shared/attributes";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import {
  LocaleTypes,
  LocalizedContent,
} from "@/features/shared/types/localization";
import {
  createEmptyLocalizedContent,
  getLocalizedValue,
  localeToHeader,
  normalizeLocalizedFields,
} from "@/features/shared/utils/localization";
import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";

import { addProviderAttributeDefinitionAction } from "../actions/add-provider-attribute-definition";
import { removeProviderAttributeDefinitionAction } from "../actions/remove-provider-attribute-definition";
import { updateProviderAttributeDefinitionAction } from "../actions/update-provider-attribute-definition";
import { useProviderTypeDetailsCacheManagement } from "../api/client/get-provider-type-details-query";
import { PROVIDER_TYPE_TRANSLATION_KEY } from "../constants";
import {
  AttributeDefinition,
  AttributeOption,
  ProviderType,
} from "../types/provider-type";

interface ProviderAttributeDefinitionManagerProps {
  providerType: ProviderType;
  onUpdate?: () => void;
}

const ATTRIBUTE_TYPE_OPTIONS = getAttributeTypeOptions(false); // Use common types only

export function ProviderAttributeDefinitionManager({
  providerType,
  onUpdate,
}: ProviderAttributeDefinitionManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const t = useTranslations(PROVIDER_TYPE_TRANSLATION_KEY);
  const { invalidateProviderTypeCache } =
    useProviderTypeDetailsCacheManagement();
  const locale = useLocale();
  const localeHeader = localeToHeader(locale as LocaleTypes);
  // Types for options
  interface OptionField {
    displayName: LocalizedContent;
    value: LocalizedContent;
  }

  // Simplified state management for the new attribute form
  const [newAttribute, setNewAttribute] = useState({
    name: createEmptyLocalizedContent(),
    description: createEmptyLocalizedContent(),
    attributeTypeId: AttributeType.Text,
    isRequired: false,
    validationRules: "",
    options: [] as AttributeOption[],
  });

  // For selection type options - simplified state management
  const [optionFields, setOptionFields] = useState<OptionField[]>([]);

  // Editing state management
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: createEmptyLocalizedContent(),
    description: createEmptyLocalizedContent(),
    attributeTypeId: AttributeType.Text,
    isRequired: false,
    validationRules: "",
  });
  const [editOptionFields, setEditOptionFields] = useState<OptionField[]>([]);

  const { execute: executeAdd } = useAction(
    addProviderAttributeDefinitionAction,
    {
      startTransition,
      onSuccess: () => {
        toast.success(t("messages.attributeAddSuccess"));
        setIsAdding(false);
        setNewAttribute({
          name: createEmptyLocalizedContent(),
          description: createEmptyLocalizedContent(),
          attributeTypeId: AttributeType.Text,
          isRequired: false,
          validationRules: "",
          options: [],
        });
        setOptionFields([]);
        // Clear React Query cache for this provider type
        invalidateProviderTypeCache(providerType.id);
        onUpdate?.();
      },
      onError: (error) => {
        toast.error(error.detail || t("messages.error"));
      },
    }
  );

  const { execute: executeRemove } = useAction(
    removeProviderAttributeDefinitionAction,
    {
      startTransition,
      onSuccess: () => {
        toast.success(t("messages.attributeRemoveSuccess"));
        // Clear React Query cache for this provider type
        invalidateProviderTypeCache(providerType.id);
        onUpdate?.();
      },
      onError: (error) => {
        toast.error(error.detail || t("messages.error"));
      },
    }
  );

  const { execute: executeUpdate } = useAction(
    updateProviderAttributeDefinitionAction,
    {
      startTransition,
      onSuccess: () => {
        toast.success(t("messages.attributeUpdateSuccess"));
        setEditingId(null);
        setEditFormData({
          name: createEmptyLocalizedContent(),
          description: createEmptyLocalizedContent(),
          attributeTypeId: AttributeType.Text,
          isRequired: false,
          validationRules: "",
        });
        setEditOptionFields([]);
        // Clear React Query cache for this provider type
        invalidateProviderTypeCache(providerType.id);
        onUpdate?.();
      },
      onError: (error) => {
        toast.error(error.detail || t("messages.error"));
      },
    }
  );

  const [DeleteConfirmDialog, confirmDelete] = useConfirm(
    t("actions.removeAttribute"),
    t("actions.removeAttributeDescription"),
    "destructive"
  );

  const isSelectionType = attributeTypeSupportsOptions(
    newAttribute.attributeTypeId
  );

  const isEditSelectionType = attributeTypeSupportsOptions(
    editFormData.attributeTypeId
  );

  const handleAddAttribute = async () => {
    // Basic validation - check if any translation exists
    const hasNameTranslation = Object.values(
      newAttribute.name.translations || {}
    ).some((t) => t?.trim());
    const hasDescTranslation = Object.values(
      newAttribute.description.translations || {}
    ).some((t) => t?.trim());

    if (!hasNameTranslation || !hasDescTranslation) {
      toast.error("Name and description are required");
      return;
    }

    // Normalize localized content and options
    const normalizedFields = normalizeLocalizedFields({
      name: newAttribute.name,
      description: newAttribute.description,
    });

    const normalizedOptions = isSelectionType
      ? optionFields.map((field) =>
          normalizeLocalizedFields({
            displayName: field.displayName,
            value: field.value,
          })
        )
      : undefined;

    startTransition(async () => {
      await executeAdd({
        providerTypeId: providerType.id,
        ...newAttribute,
        ...normalizedFields,
        options: normalizedOptions,
      });
    });
  };

  const handleRemoveAttribute = async (attribute: AttributeDefinition) => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;

    startTransition(async () => {
      await executeRemove({
        providerTypeId: providerType.id,
        attributeDefinitionId: attribute.id,
      });
    });
  };

  const handleUpdateAttribute = async (attributeId: string) => {
    // Basic validation
    const hasNameTranslation = Object.values(
      editFormData.name.translations || {}
    ).some((t) => t?.trim());
    const hasDescTranslation = Object.values(
      editFormData.description.translations || {}
    ).some((t) => t?.trim());

    if (!hasNameTranslation || !hasDescTranslation) {
      toast.error("Name and description are required");
      return;
    }

    // Normalize localized content and options
    const normalizedFields = normalizeLocalizedFields({
      name: editFormData.name,
      description: editFormData.description,
    });

    const normalizedOptions = isEditSelectionType
      ? editOptionFields.map((field) =>
          normalizeLocalizedFields({
            displayName: field.displayName,
            value: field.value,
          })
        )
      : undefined;

    startTransition(async () => {
      await executeUpdate({
        providerTypeId: providerType.id,
        attributeDefinitionId: attributeId,
        ...editFormData,
        ...normalizedFields,
        options: normalizedOptions,
      });
    });
  };

  const handleEditClick = (attribute: AttributeDefinition) => {
    setEditingId(attribute.id);
    // AttributeDefinition already has converted enum value
    setEditFormData({
      name: attribute.name || createEmptyLocalizedContent(),
      description: attribute.description || createEmptyLocalizedContent(),
      attributeTypeId: attribute.attributeType || AttributeType.Text,
      isRequired: attribute.isRequired || false,
      validationRules: attribute.validationRules || "",
    });

    // Populate edit option fields if attribute has options
    if (attribute.options && attribute.options.length > 0) {
      setEditOptionFields(
        attribute.options.map((opt) => ({
          displayName: opt.displayName || createEmptyLocalizedContent(),
          value: opt.value || createEmptyLocalizedContent(),
        }))
      );
    } else {
      setEditOptionFields([]);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({
      name: createEmptyLocalizedContent(),
      description: createEmptyLocalizedContent(),
      attributeTypeId: AttributeType.Text,
      isRequired: false,
      validationRules: "",
    });
    setEditOptionFields([]);
  };

  const addOptionField = () => {
    setOptionFields((prev) => [
      ...prev,
      {
        displayName: createEmptyLocalizedContent(),
        value: createEmptyLocalizedContent(),
      },
    ]);
  };

  const removeOptionField = (index: number) => {
    setOptionFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOptionField = (
    index: number,
    field: "displayName" | "value",
    value: string | number | undefined | LocalizedContent
  ) => {
    setOptionFields((prev) =>
      prev.map((option, i) =>
        i === index ? { ...option, [field]: value as LocalizedContent } : option
      )
    );
  };

  // Edit option field management functions
  const addEditOptionField = () => {
    setEditOptionFields((prev) => [
      ...prev,
      {
        displayName: createEmptyLocalizedContent(),
        value: createEmptyLocalizedContent(),
      },
    ]);
  };

  const removeEditOptionField = (index: number) => {
    setEditOptionFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEditOptionField = (
    index: number,
    field: "displayName" | "value",
    value: string | number | undefined | LocalizedContent
  ) => {
    setEditOptionFields((prev) =>
      prev.map((option, i) =>
        i === index ? { ...option, [field]: value as LocalizedContent } : option
      )
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t("attributes.title")}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(!isAdding)}
              disabled={isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("attributes.addAttribute")}
            </Button>
          </CardTitle>
          <CardDescription>{t("attributes.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Existing Attributes List */}
          {providerType.attributeDefinitions.length > 0 ? (
            <div className="space-y-4">
              {providerType.attributeDefinitions.map((attribute) => (
                <div key={attribute.id} className="rounded-lg border p-4">
                  {editingId === attribute.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      {/* Name Field */}
                      <LocalizedInput
                        label={t("attributes.form.name.label")}
                        value={editFormData.name}
                        onChange={(value) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            name: value,
                          }))
                        }
                        required
                        maxLength={100}
                      />

                      {/* Description Field */}
                      <LocalizedInput
                        label={t("attributes.form.description.label")}
                        value={editFormData.description}
                        onChange={(value) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            description: value,
                          }))
                        }
                        richText
                        rows={2}
                        maxLength={2000}
                      />

                      {/* Attribute Type Field */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t("attributes.form.attributeType")}
                        </label>
                        <Select
                          value={
                            editFormData.attributeTypeId?.toString() ||
                            AttributeType.Text.toString()
                          }
                          onValueChange={(value) => {
                            const attributeTypeId = parseInt(
                              value
                            ) as AttributeType;
                            setEditFormData((prev) => ({
                              ...prev,
                              attributeTypeId,
                            }));
                            if (
                              !attributeTypeSupportsOptions(attributeTypeId)
                            ) {
                              setEditOptionFields([]);
                            } else if (editOptionFields.length === 0) {
                              // Initialize with empty option if switching to option-supporting type
                              setEditOptionFields([
                                {
                                  displayName: createEmptyLocalizedContent(),
                                  value: createEmptyLocalizedContent(),
                                },
                              ]);
                            }
                          }}
                          disabled={isPending}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                "attributes.form.attributeTypePlaceholder"
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {ATTRIBUTE_TYPE_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value.toString()}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Required Toggle & Validation Rules */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <span className="text-sm">
                            {t("attributes.form.isRequired")}
                          </span>
                          <Switch
                            checked={editFormData.isRequired}
                            onCheckedChange={(checked) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                isRequired: checked,
                              }))
                            }
                            disabled={isPending}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            {t("attributes.form.validationRules")}
                          </label>
                          <Input
                            value={editFormData.validationRules}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                validationRules: e.target.value,
                              }))
                            }
                            placeholder={t(
                              "attributes.form.validationRulesPlaceholder"
                            )}
                            disabled={isPending}
                          />
                        </div>
                      </div>

                      {/* Options Management for Selection Type */}
                      {isEditSelectionType && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                              {t("attributes.form.options")}
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addEditOptionField}
                              disabled={isPending}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              {t("attributes.form.addOption")}
                            </Button>
                          </div>

                          {editOptionFields.map((field, index) => (
                            <div
                              key={index}
                              className="flex flex-col items-end gap-2 rounded-lg border p-3"
                            >
                              <div className="flex-1">
                                <LocalizedInput
                                  label={t("attributes.form.displayName.label")}
                                  value={field.displayName}
                                  onChange={(value) =>
                                    updateEditOptionField(
                                      index,
                                      "displayName",
                                      value
                                    )
                                  }
                                  maxLength={100}
                                />
                              </div>

                              <div className="flex-1">
                                <LocalizedInput
                                  label={t("attributes.form.value.label")}
                                  value={field.value}
                                  onChange={(value) =>
                                    updateEditOptionField(index, "value", value)
                                  }
                                  maxLength={100}
                                />
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEditOptionField(index)}
                                disabled={isPending}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}

                          {editOptionFields.length === 0 && (
                            <p className="text-muted-foreground rounded-lg border py-4 text-center text-sm">
                              {t("attributes.form.noOptions")}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Save/Cancel Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdateAttribute(attribute.id)}
                          disabled={isPending}
                          size="sm"
                        >
                          {t("actions.save")}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isPending}
                          size="sm"
                        >
                          {t("actions.cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {attribute.name
                                ? typeof attribute.name === "string"
                                  ? attribute.name
                                  : getLocalizedValue(
                                      attribute.name,
                                      localeHeader
                                    )
                                : ""}
                            </h4>
                            <div className="text-muted-foreground text-sm">
                              {attribute.description ? (
                                typeof attribute.description === "string" ? (
                                  attribute.description
                                ) : (
                                  <LexicalRenderer
                                    content={getLocalizedValue(
                                      attribute.description,
                                      localeHeader
                                    )}
                                  />
                                )
                              ) : (
                                ""
                              )}
                            </div>
                            <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
                              <span>
                                {t("attributes.form.type")}:{" "}
                                {attribute.attributeType}
                              </span>
                              <span>
                                {t("attributes.form.required")}:{" "}
                                {attribute.isRequired
                                  ? t("attributes.form.yes")
                                  : t("attributes.form.no")}
                              </span>
                              {attribute.validationRules && (
                                <span>
                                  {t("attributes.form.rules")}:{" "}
                                  {attribute.validationRules}
                                </span>
                              )}
                              {attribute.options &&
                                attribute.options.length > 0 && (
                                  <span>
                                    {t("attributes.form.optionsCount")}:{" "}
                                    {attribute.options.length}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(attribute)}
                          disabled={isPending || editingId !== null}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttribute(attribute)}
                          disabled={isPending || editingId !== null}
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
              {t("attributes.noAttributes")}
            </p>
          )}

          {/* Add New Attribute Form */}
          {isAdding && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{t("attributes.addNew")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Name Field */}
                  <LocalizedInput
                    label={t("attributes.form.name.label")}
                    value={newAttribute.name}
                    onChange={(value) =>
                      setNewAttribute((prev) => ({
                        ...prev,
                        name: value,
                      }))
                    }
                    required
                    maxLength={100}
                  />

                  {/* Description Field */}
                  <LocalizedInput
                    label={t("attributes.form.description.label")}
                    value={newAttribute.description}
                    onChange={(value) =>
                      setNewAttribute((prev) => ({
                        ...prev,
                        description: value,
                      }))
                    }
                    richText
                    rows={2}
                    maxLength={2000}
                  />

                  {/* Attribute Type Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t("attributes.form.attributeType")}
                    </label>
                    <Select
                      value={
                        newAttribute.attributeTypeId?.toString() ||
                        AttributeType.Text.toString()
                      }
                      onValueChange={(value) => {
                        const attributeTypeId = parseInt(
                          value
                        ) as AttributeType;
                        setNewAttribute((prev) => ({
                          ...prev,
                          attributeTypeId,
                          options: attributeTypeSupportsOptions(attributeTypeId)
                            ? prev.options
                            : [],
                        }));
                        if (!attributeTypeSupportsOptions(attributeTypeId)) {
                          setOptionFields([]);
                        }
                      }}
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "attributes.form.attributeTypePlaceholder"
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTRIBUTE_TYPE_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value.toString()}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Required Toggle & Validation Rules */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm">
                        {t("attributes.form.isRequired")}
                      </span>
                      <Switch
                        checked={newAttribute.isRequired}
                        onCheckedChange={(checked) =>
                          setNewAttribute((prev) => ({
                            ...prev,
                            isRequired: checked,
                          }))
                        }
                        disabled={isPending}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t("attributes.form.validationRules")}
                      </label>
                      <Input
                        value={newAttribute.validationRules}
                        onChange={(e) =>
                          setNewAttribute((prev) => ({
                            ...prev,
                            validationRules: e.target.value,
                          }))
                        }
                        placeholder={t(
                          "attributes.form.validationRulesPlaceholder"
                        )}
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  {/* Options Management for Selection Type */}
                  {isSelectionType && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          {t("attributes.form.options")}
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOptionField}
                          disabled={isPending}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {t("attributes.form.addOption")}
                        </Button>
                      </div>

                      {optionFields.map((field, index) => (
                        <div
                          key={index}
                          className="flex flex-col items-end gap-2 rounded-lg border p-3"
                        >
                          <div className="flex-1">
                            <LocalizedInput
                              label={t("attributes.form.displayName.label")}
                              value={field.displayName}
                              onChange={(value) =>
                                updateOptionField(index, "displayName", value)
                              }
                              maxLength={100}
                            />
                          </div>

                          <div className="flex-1">
                            <LocalizedInput
                              label={t("attributes.form.value.label")}
                              value={field.value}
                              onChange={(value) =>
                                updateOptionField(index, "value", value)
                              }
                              maxLength={100}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOptionField(index)}
                            disabled={isPending}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      {optionFields.length === 0 && (
                        <p className="text-muted-foreground rounded-lg border py-4 text-center text-sm">
                          {t("attributes.form.noOptions")}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddAttribute}
                      disabled={
                        isPending ||
                        !newAttribute.name ||
                        !newAttribute.description
                      }
                    >
                      {isPending
                        ? t("attributes.form.adding")
                        : t("attributes.form.add")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAdding(false);
                        setNewAttribute({
                          name: createEmptyLocalizedContent(),
                          description: createEmptyLocalizedContent(),
                          attributeTypeId: AttributeType.Text,
                          isRequired: false,
                          validationRules: "",
                          options: [],
                        });
                        setOptionFields([]);
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
