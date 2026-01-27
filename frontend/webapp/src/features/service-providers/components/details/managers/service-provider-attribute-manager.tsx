"use client";

import { useState, useTransition } from "react";
import { Edit, Plus, Settings, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { localeToHeader, SUPPORTED_LOCALE_HEADERS } from "@/config/locales";
import { useProviderTypeDetails } from "@/features/provider-types/api/client/get-provider-type-details-query";
import { useServiceProvidersByTypeCacheManagement } from "@/features/service-providers/api/client/get-service-providers-by-type";
import {
  ATTRIBUTE_TYPE_LABELS,
  AttributeType,
  attributeTypeSupportsOptions,
} from "@/features/shared/attributes/types/attribute-type";
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

import { addProviderAttribute } from "../../../actions/add-provider-attribute";
import { removeProviderAttribute } from "../../../actions/remove-provider-attribute";
import { updateProviderAttribute } from "../../../actions/update-provider-attribute";
import { ServiceProviderAttribute } from "../../../types";
import { TRANSLATION_KEY } from "../../../types/constants";

interface ServiceProviderAttributeManagerProps {
  serviceProviderId: string;
  providerTypeId: string;
  currentAttributes?: ServiceProviderAttribute[];
  onUpdate?: () => void;
}

export default function ServiceProviderAttributeManager({
  serviceProviderId,
  providerTypeId,
  currentAttributes = [],
  onUpdate,
}: ServiceProviderAttributeManagerProps) {
  const t = useTranslations(TRANSLATION_KEY);
  const locale = useLocale();
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    value: createEmptyLocalizedContent(),
  });
  const { invalidateAllCache: invalidateServiceProviderDetailsCache } =
    useServiceProvidersByTypeCacheManagement();
  // Fetch provider type details to get attribute definitions
  const {
    data: providerType,
    error: providerTypeError,
    isFetching: isLoadingProviderType,
  } = useProviderTypeDetails(providerTypeId);

  // Form state for new attribute
  const [newAttribute, setNewAttribute] = useState({
    attributeDefinitionId: "",
    attributeName: "",
    value: createEmptyLocalizedContent(),
  });

  const { execute: executeAdd } = useAction(addProviderAttribute, {
    startTransition,
    onSuccess: () => {
      toast.success(t("attributes.messages.addSuccess"));
      setIsAdding(false);
      setNewAttribute({
        attributeDefinitionId: "",
        attributeName: "",
        value: createEmptyLocalizedContent(),
      });
      invalidateServiceProviderDetailsCache();
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("attributes.messages.addError"));
    },
  });

  const { execute: executeRemove } = useAction(removeProviderAttribute, {
    startTransition,
    onSuccess: () => {
      toast.success(t("attributes.messages.removeSuccess"));
      invalidateServiceProviderDetailsCache();
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("attributes.messages.removeError"));
    },
  });

  const { execute: executeUpdate } = useAction(updateProviderAttribute, {
    startTransition,
    onSuccess: () => {
      toast.success(t("attributes.messages.updateSuccess"));
      setEditingId(null);
      setEditFormData({ value: createEmptyLocalizedContent() });
      invalidateServiceProviderDetailsCache();
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("attributes.messages.updateError"));
    },
  });

  const [ConfirmDialog, confirm] = useConfirm(
    t("attributes.removeDialog.title"),
    t("attributes.removeDialog.description")
  );

  // Get available attribute definitions (not already assigned)
  const availableAttributeDefinitions =
    providerType?.attributeDefinitions?.filter(
      (def) =>
        !currentAttributes.some((attr) => attr.attributeDefinitionId === def.id)
    ) || [];

  const handleAttributeDefinitionChange = (attributeDefinitionId: string) => {
    const selectedDef = providerType?.attributeDefinitions?.find(
      (def) => def.id === attributeDefinitionId
    );
    if (selectedDef) {
      setNewAttribute((prev) => ({
        ...prev,
        attributeDefinitionId,
        attributeName:
          selectedDef.name.translations[localeHeader] ??
          Object.values(selectedDef.name.translations)[0] ??
          "",
        value: createEmptyLocalizedContent(), // Clear value when switching attribute types
      }));
    } else {
      setNewAttribute((prev) => ({
        ...prev,
        attributeDefinitionId: "",
        attributeName: "",
        value: createEmptyLocalizedContent(), // Clear value when no definition selected
      }));
    }
  };

  const handleAdd = () => {
    if (!newAttribute.attributeDefinitionId) {
      toast.error(t("attributes.messages.attributeRequired"));
      return;
    }

    // Normalize localized content
    const normalizedFields = normalizeLocalizedFields({
      value: newAttribute.value,
    });

    // Validate that value has at least one translation
    const hasValue =
      Object.keys(normalizedFields.value.translations).length > 0;
    if (!hasValue) {
      toast.error(t("attributes.messages.valueRequired"));
      return;
    }

    executeAdd({
      serviceProviderId,
      attributeDefinitionId: newAttribute.attributeDefinitionId,
      value: normalizedFields.value,
    });
  };

  const handleRemove = async (attribute: ServiceProviderAttribute) => {
    const ok = await confirm();
    if (ok) {
      executeRemove({
        serviceProviderId,
        attributeId: attribute.attributeDefinitionId,
      });
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewAttribute({
      attributeDefinitionId: "",
      attributeName: "",
      value: createEmptyLocalizedContent(),
    });
  };

  const handleEditClick = (attribute: ServiceProviderAttribute) => {
    setEditingId(attribute.id);
    setEditFormData({
      value: attribute.value,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ value: createEmptyLocalizedContent() });
  };

  const handleUpdateAttribute = () => {
    if (!editingId) return;

    // Find the attribute to get its definition ID
    const attribute = currentAttributes.find((a) => a.id === editingId);
    if (!attribute) return;

    // Normalize localized content
    const normalizedFields = normalizeLocalizedFields({
      value: editFormData.value,
    });

    // Validate that value has at least one translation
    const hasValue =
      Object.keys(normalizedFields.value.translations).length > 0;
    if (!hasValue) {
      toast.error(t("attributes.messages.valueRequired"));
      return;
    }

    executeUpdate({
      serviceProviderId,
      attributeDefinitionId: attribute.attributeDefinitionId,
      value: normalizedFields.value,
    });
  };

  // Show loading state while fetching provider type
  if (isLoadingProviderType) {
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Show error state if provider type failed to load
  if (providerTypeError) {
    return (
      <div className="pt-4 text-center">
        <p className="text-destructive mb-4">
          {t("attributes.messages.fetchError")}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("attributes.actions.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("attributes.title")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("attributes.description")}
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          disabled={
            isPending || isAdding || availableAttributeDefinitions.length === 0
          }
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("attributes.actions.add")}
        </Button>
      </div>

      {/* Show provider type info */}
      {providerType && (
        <Card className="bg-muted/15">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Settings className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="font-medium">
                  {getLocalizedValue(providerType.name, localeHeader)}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t("attributes.availableDefinitions")}:{" "}
                  {providerType.attributeDefinitions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing attributes */}
      <div className="grid gap-3">
        {currentAttributes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-muted-foreground text-center">
                <Settings className="mx-auto mb-2 h-8 w-8" />
                <p>{t("attributes.noAttributes")}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          currentAttributes.map((attribute) => {
            const isEditing = editingId === attribute.id;
            const attributeDef = providerType?.attributeDefinitions?.find(
              (def) => def.id === attribute.attributeDefinitionId
            );

            return (
              <Card key={attribute.id}>
                <CardContent className="pt-4">
                  {isEditing ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {typeof attribute.attributeName === "string"
                            ? attribute.attributeName
                            : getLocalizedValue(
                                attribute.attributeName,
                                localeHeader
                              )}
                        </h4>
                      </div>

                      {/* Value input based on attribute type */}
                      {attributeDef &&
                      attributeTypeSupportsOptions(
                        attributeDef.attributeType
                      ) ? (
                        // Selection type - show dropdown
                        <div className="space-y-2">
                          <Label>{t("attributes.form.value")}</Label>
                          <Select
                            value={getLocalizedValue(
                              editFormData.value,
                              localeHeader
                            )}
                            onValueChange={(value) => {
                              var val = attributeDef.options?.find(
                                (option) =>
                                  option.value.translations[localeHeader] ===
                                  value
                              )?.value
                                .translations as LocalizedContent["translations"];
                              setEditFormData((prev) => ({
                                ...prev,
                                value: {
                                  ...prev.value,
                                  translations: val,
                                },
                              }));
                            }}
                            disabled={isPending}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("attributes.form.selectValue")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {attributeDef.options?.map((option) => (
                                <SelectItem
                                  key={
                                    typeof option.value === "string"
                                      ? option.value
                                      : getLocalizedValue(
                                          option.value,
                                          localeHeader
                                        )
                                  }
                                  value={
                                    typeof option.value === "string"
                                      ? option.value
                                      : getLocalizedValue(
                                          option.value,
                                          localeHeader
                                        )
                                  }
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {typeof option.displayName === "string"
                                        ? option.displayName
                                        : getLocalizedValue(
                                            option.displayName,
                                            localeHeader
                                          )}
                                    </span>
                                    {option.additionalPrice && (
                                      <span className="text-muted-foreground text-xs">
                                        +{option.additionalPrice}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : attributeDef &&
                        attributeDef.attributeType === AttributeType.Boolean ? (
                        // Boolean type - show Switch
                        <div className="space-y-2">
                          <Label>{t("attributes.form.value")}</Label>
                          <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label className="text-sm">
                              {getLocalizedValue(
                                editFormData.value,
                                localeHeader
                              ) === "true"
                                ? t("attributes.form.yes")
                                : t("attributes.form.no")}
                            </Label>
                            <Switch
                              checked={
                                getLocalizedValue(
                                  editFormData.value,
                                  localeHeader
                                ) === "true"
                              }
                              onCheckedChange={(checked) => {
                                // Store boolean as plain string "true" or "false" across all locales
                                const value = checked ? "true" : "false";
                                setEditFormData((prev) => ({
                                  ...prev,
                                  value: {
                                    translations: Object.fromEntries(
                                      SUPPORTED_LOCALE_HEADERS.map((locale) => [
                                        locale,
                                        value,
                                      ])
                                    ),
                                  },
                                }));
                              }}
                              disabled={isPending}
                            />
                          </div>
                        </div>
                      ) : (
                        // Text type - show LocalizedInput
                        <div className="space-y-2">
                          <LocalizedInput
                            value={editFormData.value}
                            onChange={(value) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                value: value,
                              }))
                            }
                            label={t("attributes.form.value")}
                            rows={4}
                          />
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isPending}
                          size="sm"
                        >
                          {t("attributes.actions.cancel")}
                        </Button>
                        <Button
                          onClick={handleUpdateAttribute}
                          disabled={
                            isPending ||
                            Object.keys(editFormData.value.translations)
                              .length === 0
                          }
                          size="sm"
                        >
                          {t("attributes.actions.save")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {typeof attribute.attributeName === "string"
                              ? attribute.attributeName
                              : getLocalizedValue(
                                  attribute.attributeName,
                                  localeHeader
                                )}
                          </h4>
                        </div>
                        <div className="rounded p-3">
                          <div className="text-sm">
                            <p>
                              {getLocalizedValue(attribute.value, localeHeader)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(attribute)}
                          disabled={isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(attribute)}
                          disabled={isPending}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add attribute form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("attributes.add.title")}
            </CardTitle>
            <CardDescription>{t("attributes.add.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableAttributeDefinitions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  {t("attributes.noAvailableDefinitions")}
                </p>
                <Button variant="outline" onClick={handleCancel}>
                  {t("attributes.actions.cancel")}
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("attributes.form.attributeDefinition")}
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Select
                    value={newAttribute.attributeDefinitionId}
                    onValueChange={handleAttributeDefinitionChange}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("attributes.form.selectAttribute")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAttributeDefinitions.map((def) => (
                        <SelectItem key={def.id} value={def.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {getLocalizedValue(def.name, localeHeader)}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {ATTRIBUTE_TYPE_LABELS[def.attributeType]}
                              {def.isRequired && " • Required"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show selected attribute definition details */}
                {newAttribute.attributeDefinitionId && (
                  <div className="space-y-2 rounded-lg border p-3">
                    <h5 className="text-sm font-medium">
                      {t("attributes.form.selectedAttribute")}
                    </h5>
                    {(() => {
                      const selectedDef = availableAttributeDefinitions.find(
                        (def) => def.id === newAttribute.attributeDefinitionId
                      );
                      if (!selectedDef) return null;
                      return (
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-muted-foreground">
                              {t("attributes.form.name")}:
                            </span>
                            <span className="ml-2 font-medium">
                              {getLocalizedValue(
                                selectedDef.name,
                                localeHeader
                              )}
                            </span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">
                              {t("attributes.form.type")}:
                            </span>
                            <span className="ml-2">
                              {ATTRIBUTE_TYPE_LABELS[selectedDef.attributeType]}
                            </span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">
                              {t("attributes.form.required")}:
                            </span>
                            <span className="ml-2">
                              {selectedDef.isRequired
                                ? t("attributes.form.yes")
                                : t("attributes.form.no")}
                            </span>
                          </p>
                          <div className="text-xs">
                            <LexicalRenderer
                              content={getLocalizedValue(
                                selectedDef.description,
                                localeHeader
                              )}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="space-y-2">
                  {(() => {
                    const selectedDef = availableAttributeDefinitions.find(
                      (def) => def.id === newAttribute.attributeDefinitionId
                    );

                    // Show dropdown for Selection type attributes
                    if (
                      selectedDef &&
                      attributeTypeSupportsOptions(selectedDef.attributeType)
                    ) {
                      const currentValue = getLocalizedValue(
                        newAttribute.value,
                        localeHeader
                      );
                      return (
                        <Select
                          value={currentValue}
                          onValueChange={(value) => {
                            var val = selectedDef.options?.find(
                              (option) =>
                                option.value.translations[localeHeader] ===
                                value
                            )?.value
                              .translations as LocalizedContent["translations"];
                            setNewAttribute((prev) => ({
                              ...prev,
                              value: {
                                ...prev.value,
                                translations: val,
                              },
                            }));
                          }}
                          disabled={isPending}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("attributes.form.selectValue")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedDef.options?.map((option) => (
                              <SelectItem
                                key={
                                  typeof option.value === "string"
                                    ? option.value
                                    : getLocalizedValue(
                                        option.value,
                                        localeHeader
                                      )
                                }
                                value={
                                  typeof option.value === "string"
                                    ? option.value
                                    : getLocalizedValue(
                                        option.value,
                                        localeHeader
                                      )
                                }
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {typeof option.displayName === "string"
                                      ? option.displayName
                                      : getLocalizedValue(
                                          option.displayName,
                                          localeHeader
                                        )}
                                  </span>
                                  {option.additionalPrice && (
                                    <span className="text-muted-foreground text-xs">
                                      +{option.additionalPrice}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }

                    // Show Switch for Boolean type attributes
                    if (
                      selectedDef &&
                      selectedDef.attributeType === AttributeType.Boolean
                    ) {
                      const currentValue = getLocalizedValue(
                        newAttribute.value,
                        localeHeader
                      );
                      const isChecked = currentValue === "true";

                      return (
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <Label className="text-sm font-medium">
                            {t("attributes.form.value")}
                            <span className="text-destructive ml-1">*</span>
                          </Label>
                          <Switch
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              // Store boolean as plain string "true" or "false" across all locales
                              const value = checked ? "true" : "false";
                              setNewAttribute((prev) => ({
                                ...prev,
                                value: {
                                  translations: Object.fromEntries(
                                    SUPPORTED_LOCALE_HEADERS.map((locale) => [
                                      locale,
                                      value,
                                    ])
                                  ),
                                },
                              }));
                            }}
                            disabled={isPending}
                          />
                        </div>
                      );
                    }

                    // Show LocalizedInput for all other attribute types
                    return (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t("attributes.form.value")}
                          <span className="text-destructive ml-1">*</span>
                        </label>
                        <LocalizedInput
                          value={newAttribute.value}
                          onChange={(value) =>
                            setNewAttribute((prev) => ({
                              ...prev,
                              value: value,
                            }))
                          }
                          label={t("attributes.form.valuePlaceholder")}
                          rows={4}
                        />
                      </div>
                    );
                  })()}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isPending}
                  >
                    {t("attributes.actions.cancel")}
                  </Button>
                  <Button
                    onClick={handleAdd}
                    disabled={
                      isPending ||
                      !newAttribute.attributeDefinitionId ||
                      Object.keys(newAttribute.value.translations).length === 0
                    }
                  >
                    {t("attributes.actions.add")}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog />
    </div>
  );
}
