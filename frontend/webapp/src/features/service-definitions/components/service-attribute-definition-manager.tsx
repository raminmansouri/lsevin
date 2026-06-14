"use client";

import { useState, useTransition } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { SafeLexicalRenderer } from "./safe-lexical-renderer";
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
import {
  AttributeType,
  attributeTypeFromString,
  AttributeTypeString,
  attributeTypeSupportsOptions,
  getAttributeTypeOptions,
} from "@/features/shared/attributes";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import { LocalizedContent } from "@/features/shared/types/localization";
import {
  createEmptyLocalizedContent,
  getLocalizedValue,
  normalizeLocalizedFields,
} from "@/features/shared/utils/localization";
import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";
import { LocaleTypes } from "@/types/common";

import { addServiceAttributeDefinitionAction } from "../actions/add-service-attribute-definition";
import { removeServiceAttributeDefinitionAction } from "../actions/remove-service-attribute-definition";
import { updateServiceAttributeDefinitionAction } from "../actions/update-service-attribute-definition";
import { useServiceDefinitionDetailsCacheManagement } from "../api/client/get-service-definition-details-query";
import { SERVICE_DEFINITION_TRANSLATION_KEY } from "../constants";
import {
  ServiceAttributeDefinition,
  ServiceDefinitionDetails,
} from "../types/service-definition";
import { LazyServiceDefinitionLookupSelect } from "./lazy-service-definition-lookup-select";

interface ServiceAttributeDefinitionManagerProps {
  serviceDefinition: ServiceDefinitionDetails;
  onUpdate?: () => void;
}

const ATTRIBUTE_TYPE_OPTIONS = getAttributeTypeOptions(false); // Use common types only
const ATTRIBUTE_TYPE_LOOKUP_OPTIONS = ATTRIBUTE_TYPE_OPTIONS.map((option) => ({
  value: option.value.toString(),
  label: option.label,
}));

export function ServiceAttributeDefinitionManager({
  serviceDefinition,
  onUpdate,
}: ServiceAttributeDefinitionManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const t = useTranslations(SERVICE_DEFINITION_TRANSLATION_KEY);
  const { invalidateServiceDefinitionCache } =
    useServiceDefinitionDetailsCacheManagement();

  // Types for service attribute options
  interface ServiceOptionField {
    displayName: LocalizedContent;
    value: LocalizedContent;
    additionalPrice?: number;
  }

  // Simplified state management for the new attribute form
  const [newAttribute, setNewAttribute] = useState({
    name: createEmptyLocalizedContent(),
    description: createEmptyLocalizedContent(),
    attributeType: AttributeType.Text,
    isRequired: false,
    affectsPricing: false,
    options: [] as ServiceOptionField[],
  });

  // For selection type options - simplified state management
  const [optionFields, setOptionFields] = useState<ServiceOptionField[]>([]);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: createEmptyLocalizedContent(),
    description: createEmptyLocalizedContent(),
    attributeType: AttributeType.Text,
    isRequired: false,
    affectsPricing: false,
    displayOrder: 0,
    options: [] as ServiceOptionField[],
  });

  // For edit mode options
  const [editOptionFields, setEditOptionFields] = useState<
    ServiceOptionField[]
  >([]);

  const { execute: executeAdd } = useAction(
    addServiceAttributeDefinitionAction,
    {
      startTransition,
      onSuccess: () => {
        toast.success(t("messages.attributeAddSuccess"));
        setIsAdding(false);
        setNewAttribute({
          name: createEmptyLocalizedContent(),
          description: createEmptyLocalizedContent(),
          attributeType: AttributeType.Text,
          isRequired: false,
          affectsPricing: false,
          options: [],
        });
        setOptionFields([]);
        // Clear React Query cache for this service definition
        invalidateServiceDefinitionCache(serviceDefinition.id);
        onUpdate?.();
      },
      onError: (error) => {
        toast.error(error.detail || t("messages.error"));
      },
    }
  );

  const { execute: executeRemove } = useAction(
    removeServiceAttributeDefinitionAction,
    {
      startTransition,
      onSuccess: () => {
        toast.success(t("messages.attributeRemoveSuccess"));
        // Clear React Query cache for this service definition
        invalidateServiceDefinitionCache(serviceDefinition.id);
        onUpdate?.();
      },
      onError: (error) => {
        toast.error(error.detail || t("messages.error"));
      },
    }
  );

  const { execute: executeUpdate } = useAction(
    updateServiceAttributeDefinitionAction,
    {
      startTransition,
      onSuccess: () => {
        toast.success(t("messages.attributeUpdateSuccess"));
        setEditingId(null);
        setEditFormData({
          name: createEmptyLocalizedContent(),
          description: createEmptyLocalizedContent(),
          attributeType: AttributeType.Text,
          isRequired: false,
          affectsPricing: false,
          displayOrder: 0,
          options: [],
        });
        setEditOptionFields([]);
        // Clear React Query cache for this service definition
        invalidateServiceDefinitionCache(serviceDefinition.id);
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
    newAttribute.attributeType
  );

  const isEditSelectionType = attributeTypeSupportsOptions(
    editFormData.attributeType
  );

  const locale = useLocale();
  const localeHeader = localeToHeader(locale as LocaleTypes);

  const handleAddAttribute = async () => {
    // Basic validation
    const hasNameTranslation = Object.values(
      newAttribute.name.translations
    ).some((t) => t?.trim());
    const hasDescriptionTranslation = Object.values(
      newAttribute.description.translations
    ).some((t) => t?.trim());

    if (!hasNameTranslation || !hasDescriptionTranslation) {
      toast.error("Name and description are required");
      return;
    }

    // Normalize localized content
    const normalizedFields = normalizeLocalizedFields({
      name: newAttribute.name,
      description: newAttribute.description,
    });

    // Normalize option fields
    const normalizedOptions = isSelectionType
      ? optionFields.map((option) => ({
          ...option,
          displayName: normalizeLocalizedFields({
            displayName: option.displayName,
          }).displayName,
          additionalPrice: option.additionalPrice ?? 0,
        }))
      : undefined;

    startTransition(async () => {
      await executeAdd({
        serviceDefinitionId: serviceDefinition.id,
        ...newAttribute,
        ...normalizedFields,
        options: normalizedOptions,
      });
    });
  };

  const handleRemoveAttribute = async (
    attribute: ServiceAttributeDefinition
  ) => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;

    startTransition(async () => {
      await executeRemove({
        serviceDefinitionId: serviceDefinition.id,
        attributeDefinitionId: attribute.id,
      });
    });
  };

  const addOptionField = () => {
    setOptionFields((prev) => [
      ...prev,
      {
        displayName: createEmptyLocalizedContent(),
        value: createEmptyLocalizedContent(),
        additionalPrice: 0,
      },
    ]);
  };

  const removeOptionField = (index: number) => {
    setOptionFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOptionField = (
    index: number,
    field: keyof ServiceOptionField,
    value: string | number | undefined | LocalizedContent
  ) => {
    setOptionFields((prev) =>
      prev.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      )
    );
  };

  const updateEditOptionField = (
    index: number,
    field: keyof ServiceOptionField,
    value: string | number | undefined | LocalizedContent
  ) => {
    setEditOptionFields((prev) =>
      prev.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      )
    );
  };

  const addEditOptionField = () => {
    setEditOptionFields((prev) => [
      ...prev,
      {
        displayName: createEmptyLocalizedContent(),
        value: createEmptyLocalizedContent(),
        additionalPrice: 0,
      },
    ]);
  };

  const removeEditOptionField = (index: number) => {
    setEditOptionFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditClick = (attribute: ServiceAttributeDefinition) => {
    setEditingId(attribute.id);
    // Convert API string to enum value
    const attributeTypeEnum = attributeTypeFromString(
      attribute.attributeType as AttributeTypeString
    );
    setEditFormData({
      name: attribute.name,
      description: attribute.description,
      attributeType: attributeTypeEnum,
      isRequired: attribute.isRequired,
      affectsPricing: attribute.affectsPricing,
      displayOrder: attribute.displayOrder,
      options: [],
    });
    // Set edit option fields from existing options
    setEditOptionFields(
      attribute.options?.map((option) => ({
        displayName: option.displayName,
        value: option.value,
        additionalPrice: option.additionalPrice ?? 0,
      })) || []
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({
      name: createEmptyLocalizedContent(),
      description: createEmptyLocalizedContent(),
      attributeType: AttributeType.Text,
      isRequired: false,
      affectsPricing: false,
      displayOrder: 0,
      options: [],
    });
    setEditOptionFields([]);
  };

  const handleUpdateAttribute = async () => {
    if (!editingId) return;

    // Basic validation
    const hasNameTranslation = Object.values(
      editFormData.name.translations
    ).some((t) => t?.trim());
    const hasDescriptionTranslation = Object.values(
      editFormData.description.translations
    ).some((t) => t?.trim());

    if (!hasNameTranslation || !hasDescriptionTranslation) {
      toast.error("Name and description are required");
      return;
    }

    // Normalize localized content
    const normalizedFields = normalizeLocalizedFields({
      name: editFormData.name,
      description: editFormData.description,
    });

    // Normalize option fields
    const normalizedOptions = isEditSelectionType
      ? editOptionFields.map((option) => ({
          ...option,
          displayName: normalizeLocalizedFields({
            displayName: option.displayName,
          }).displayName,
          additionalPrice: option.additionalPrice ?? 0,
        }))
      : undefined;

    startTransition(async () => {
      await executeUpdate({
        serviceDefinitionId: serviceDefinition.id,
        attributeDefinitionId: editingId,
        ...editFormData,
        ...normalizedFields,
        options: normalizedOptions,
      });
    });
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
          {serviceDefinition.attributeDefinitions.length > 0 ? (
            <div className="space-y-4">
              {serviceDefinition.attributeDefinitions.map((attribute) => (
                <div key={attribute.id} className="rounded-lg border p-4">
                  {editingId === attribute.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      {/* Name Field */}
                      <div className="space-y-2">
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
                      </div>

                      {/* Description Field */}
                      <div className="space-y-2">
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
                      </div>

                      {/* Attribute Type Field */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t("attributes.form.attributeType")}
                        </label>
                        <LazyServiceDefinitionLookupSelect
                          lookupType="attributeTypes"
                          locale={locale}
                          value={editFormData.attributeType.toString()}
                          onValueChange={(value) => {
                            if (!value) return;
                            const attributeType = parseInt(value) as AttributeType;
                            setEditFormData((prev) => ({
                              ...prev,
                              attributeType,
                            }));
                            if (!attributeTypeSupportsOptions(attributeType)) {
                              setEditOptionFields([]);
                            } else if (editOptionFields.length === 0) {
                              // Initialize with empty option if switching to option-supporting type
                              setEditOptionFields([
                                {
                                  displayName: createEmptyLocalizedContent(),
                                  value: createEmptyLocalizedContent(),
                                  additionalPrice: 0,
                                },
                              ]);
                            }
                          }}
                          placeholder={t("attributes.form.attributeTypePlaceholder")}
                          searchPlaceholder="Search attribute types..."
                          emptyMessage="No attribute type found."
                          initialOptions={ATTRIBUTE_TYPE_LOOKUP_OPTIONS}
                          disabled={isPending}
                          allowClear={false}
                        />
                      </div>

                      {/* Required & Affects Pricing Toggles */}
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

                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <span className="text-sm">
                            {t("attributes.form.affectsPricing")}
                          </span>
                          <Switch
                            checked={editFormData.affectsPricing}
                            onCheckedChange={(checked) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                affectsPricing: checked,
                              }))
                            }
                            disabled={isPending}
                          />
                        </div>
                      </div>

                      {/* Options Management for Edit Selection Type */}
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
                              className="flex flex-col gap-2 rounded-lg border p-3"
                            >
                              <div className="flex-1 space-y-2">
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

                              <div className="flex-1 space-y-2">
                                <LocalizedInput
                                  label={t("attributes.form.value")}
                                  value={field.value}
                                  onChange={(value) =>
                                    updateEditOptionField(index, "value", value)
                                  }
                                  maxLength={100}
                                />
                              </div>

                              {/* TODO: Re-enable additionalPrice input when backend supports it */}
                              {/* <div className="w-32 space-y-2">
                                <label className="text-xs">
                                  {t("attributes.form.extraPrice")}
                                </label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={field.additionalPrice || ""}
                                  onChange={(e) =>
                                    updateEditOptionField(
                                      index,
                                      "additionalPrice",
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined
                                    )
                                  }
                                  placeholder="0.00"
                                  disabled={isPending}
                                />
                              </div> */}

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

                      {/* Edit Form Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateAttribute}
                          disabled={
                            isPending ||
                            !Object.values(editFormData.name.translations).some(
                              (t) => t?.trim()
                            ) ||
                            !Object.values(
                              editFormData.description.translations
                            ).some((t) => t?.trim())
                          }
                        >
                          {isPending ? t("actions.saving") : t("actions.save")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isPending}
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
                              {getLocalizedValue(attribute.name, localeHeader)}
                            </h4>
                            <div className="text-muted-foreground text-sm">
                              <SafeLexicalRenderer
                                content={getLocalizedValue(
                                  attribute.description,
                                  localeHeader
                                )}
                              />
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
                              <span>
                                {t("attributes.form.affectsPricingLabel")}:{" "}
                                {attribute.affectsPricing
                                  ? t("attributes.form.yes")
                                  : t("attributes.form.no")}
                              </span>
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
                <div className="flex flex-col gap-4">
                  {/* Name Field */}
                  <div className="space-y-2">
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
                  </div>

                  {/* Description Field */}
                  <div className="space-y-2">
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
                  </div>

                  {/* Attribute Type Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t("attributes.form.attributeType")}
                    </label>
                    <LazyServiceDefinitionLookupSelect
                      lookupType="attributeTypes"
                      locale={locale}
                      value={newAttribute.attributeType.toString()}
                      onValueChange={(value) => {
                        if (!value) return;
                        const attributeType = parseInt(value) as AttributeType;
                        setNewAttribute((prev) => ({
                          ...prev,
                          attributeType,
                          options: attributeTypeSupportsOptions(attributeType)
                            ? prev.options
                            : [],
                        }));
                        if (!attributeTypeSupportsOptions(attributeType)) {
                          setOptionFields([]);
                        }
                      }}
                      placeholder={t("attributes.form.attributeTypePlaceholder")}
                      searchPlaceholder="Search attribute types..."
                      emptyMessage="No attribute type found."
                      initialOptions={ATTRIBUTE_TYPE_LOOKUP_OPTIONS}
                      disabled={isPending}
                      allowClear={false}
                    />
                  </div>

                  {/* Required & Affects Pricing Toggles */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm">
                        {t("attributes.form.affectsPricing")}
                      </span>
                      <Switch
                        checked={newAttribute.affectsPricing}
                        onCheckedChange={(checked) =>
                          setNewAttribute((prev) => ({
                            ...prev,
                            affectsPricing: checked,
                          }))
                        }
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
                          className="flex flex-col gap-2 rounded-lg border p-3"
                        >
                          <div className="flex-1 space-y-2">
                            <LocalizedInput
                              label={t("attributes.form.displayName.label")}
                              value={field.displayName}
                              onChange={(value) =>
                                updateOptionField(index, "displayName", value)
                              }
                              maxLength={100}
                            />
                          </div>

                          <div className="flex-1 space-y-2">
                            <LocalizedInput
                              label={t("attributes.form.value")}
                              value={field.value}
                              onChange={(value) =>
                                updateOptionField(index, "value", value)
                              }
                              maxLength={100}
                            />
                          </div>

                          {/* TODO: Re-enable additionalPrice input when backend supports it */}
                          {/* <div className="w-32 space-y-2">
                            <label className="text-xs">
                              {t("attributes.form.extraPrice")}
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={field.additionalPrice || ""}
                              onChange={(e) =>
                                updateOptionField(
                                  index,
                                  "additionalPrice",
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined
                                )
                              }
                              placeholder="0.00"
                              disabled={isPending}
                            />
                          </div> */}

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
                        !Object.values(newAttribute.name.translations).some(
                          (t) => t?.trim()
                        ) ||
                        !Object.values(
                          newAttribute.description.translations
                        ).some((t) => t?.trim())
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
                          attributeType: AttributeType.Text,
                          isRequired: false,
                          affectsPricing: false,
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
