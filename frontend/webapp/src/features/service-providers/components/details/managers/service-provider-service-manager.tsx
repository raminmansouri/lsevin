"use client";

import { useState as useLocalState, useState, useTransition } from "react";
import {
  Check,
  ChevronsUpDown,
  Clock,
  DollarSign,
  Edit,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { LexicalRenderer } from "@/components/editor/lexical-renderer";
import { InfiniteScroll } from "@/components/fetcher/infinite-scroll";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCALE_CURRENCY_MAP, localeToHeader } from "@/config/locales";
import {
  ServiceDefinitionOptionWithAllLocales,
  useServiceDefinitionsAllLocalesBySearch,
} from "@/features/service-definitions/api/client/get-service-definitions-all-locales-by-search";
import { useServiceProvidersByTypeCacheManagement } from "@/features/service-providers/api/client/get-service-providers-by-type";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import {
  createEmptyLocalizedContent,
  getLocalizedValue,
  normalizeLocalizedFields,
} from "@/features/shared/utils/localization";
import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";
import { formatPrice } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { LocaleTypes } from "@/types/common";

import { addProviderService } from "../../../actions/add-provider-service";
import { removeProviderService } from "../../../actions/remove-provider-service";
import { updateProviderService } from "../../../actions/update-provider-service";
import { ServiceProviderService } from "../../../types";
import { TRANSLATION_KEY } from "../../../types/constants";
import ImageGalleryManager from "./image-gallery-manager";

interface ServiceProviderServiceManagerProps {
  serviceProviderId: string;
  currentServices?: ServiceProviderService[];
  onUpdate?: () => void;
}

// ServiceDefinitionSelectorWithInfiniteScroll component
interface ServiceDefinitionSelectorWithInfiniteScrollProps {
  value?: string;
  onValueChange?: (
    value: string | undefined,
    selectedData?: ServiceDefinitionOptionWithAllLocales
  ) => void;
  options: ServiceDefinitionOptionWithAllLocales[];
  onSearch?: (search: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
}

function ServiceDefinitionSelectorWithInfiniteScroll({
  value,
  onValueChange,
  options,
  onSearch,
  placeholder,
  disabled = false,
  hasNextPage = false,
  fetchNextPage,
  isFetchingNextPage = false,
}: ServiceDefinitionSelectorWithInfiniteScrollProps) {
  const [open, setOpen] = useLocalState(false);
  const t = useTranslations("ServiceDefinition");

  const selectedOption = value
    ? options.find((option) => option.id === value)
    : undefined;

  const locale = useLocale();
  const localeHeader = localeToHeader(locale as LocaleTypes);

  const formatDisplayName = (option: ServiceDefinitionOptionWithAllLocales) => {
    return getLocalizedValue(option.name, localeHeader);
  };

  const formatDescription = (option: ServiceDefinitionOptionWithAllLocales) => {
    const parts = [];
    if (option.categoryName) parts.push(option.categoryName);
    if (option.price && option.currency)
      parts.push(`${formatPrice(option.price)} ${option.currency}`);
    if (option.durationMinutes)
      parts.push(`${option.durationMinutes} ${t("units.minutesShort")}`);
    return parts.join(" • ");
  };

  const handleSelect = (optionId: string) => {
    const selectedData = options.find((option) => option.id === optionId);
    if (value === optionId) {
      onValueChange?.(undefined);
    } else {
      onValueChange?.(optionId, selectedData);
    }
    setOpen(false);
  };

  const handleRemove = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onValueChange?.(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <div className="ltr:text-left rtl:text-right">
                <div className="font-medium">
                  {formatDisplayName(selectedOption)}
                </div>
                {selectedOption.categoryName && (
                  <div className="text-muted-foreground text-xs">
                    {formatDescription(selectedOption)}
                  </div>
                )}
              </div>
              {value && (
                <div
                  className="hover:bg-muted-foreground/20 ml-auto cursor-pointer rounded-full p-0.5"
                  onClick={handleRemove}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRemove(e);
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </div>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {placeholder || t("form.selectService")}
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("search.placeholder")}
            onValueChange={onSearch}
          />
          <CommandList>
            <CommandEmpty>{t("search.noResults")}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={formatDisplayName(option)}
                  onSelect={() => handleSelect(option.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">
                      {formatDisplayName(option)}
                    </div>
                    {option.description && (
                      <div className="text-muted-foreground line-clamp-1 text-xs">
                        <LexicalRenderer
                          content={getLocalizedValue(
                            option.description,
                            localeHeader
                          )}
                        />
                      </div>
                    )}
                    {(option.categoryName ||
                      option.price ||
                      option.durationMinutes) && (
                      <div className="text-muted-foreground text-xs">
                        {formatDescription(option)}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
              {hasNextPage && (
                <CommandItem>
                  <InfiniteScroll
                    isManual
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    fetchNextPage={fetchNextPage || (() => {})}
                  />
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function ServiceProviderServiceManager({
  serviceProviderId,
  currentServices = [],
  onUpdate,
}: ServiceProviderServiceManagerProps) {
  const t = useTranslations(TRANSLATION_KEY);
  const locale = useLocale();
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const { invalidateAllCache: invalidateServiceProviderDetailsCache } =
    useServiceProvidersByTypeCacheManagement();
  // Edit state management
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    serviceId: "",
    name: createEmptyLocalizedContent(),
    description: createEmptyLocalizedContent(),
    price: 0,
    currency: "",
    durationMinutes: 0,
    isActive: true,
  });

  // Use React Query for infinite scroll service definitions
  const {
    data: serviceDefinitionOptions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useServiceDefinitionsAllLocalesBySearch(serviceSearch, locale);

  // Filter out service definitions that are already in currentServices
  const availableServiceDefinitions = serviceDefinitionOptions?.filter(
    (option) =>
      !currentServices.some(
        (service) => service.serviceDefinitionId === option.id
      )
  );

  // Form state for new service - will be auto-populated from selected service definition
  const [newService, setNewService] = useState({
    serviceDefinitionId: "",
    name: createEmptyLocalizedContent(),
    description: createEmptyLocalizedContent(),
    price: 0,
    currency: "",
    durationMinutes: 0,
    notes: createEmptyLocalizedContent(),
  });

  const { execute: executeAdd } = useAction(addProviderService, {
    startTransition,
    onSuccess: () => {
      toast.success(t("services.messages.addSuccess"));
      setIsAdding(false);
      setNewService({
        serviceDefinitionId: "",
        name: createEmptyLocalizedContent(),
        description: createEmptyLocalizedContent(),
        price: 0,
        currency: "",
        durationMinutes: 0,
        notes: createEmptyLocalizedContent(),
      });
      invalidateServiceProviderDetailsCache();
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("services.messages.addError"));
    },
  });

  const { execute: executeRemove } = useAction(removeProviderService, {
    startTransition,
    onSuccess: () => {
      toast.success(t("services.messages.removeSuccess"));
      invalidateServiceProviderDetailsCache();
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("services.messages.removeError"));
    },
  });

  const { execute: executeUpdate } = useAction(updateProviderService, {
    startTransition,
    onSuccess: () => {
      toast.success(t("services.messages.updateSuccess"));
      setEditingId(null);
      setEditFormData({
        serviceId: "",
        name: createEmptyLocalizedContent(),
        description: createEmptyLocalizedContent(),
        price: 0,
        currency: "",
        durationMinutes: 0,
        isActive: true,
      });
      invalidateServiceProviderDetailsCache();
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("services.messages.updateError"));
    },
  });

  const [ConfirmDialog, confirm] = useConfirm(
    t("services.removeDialog.title"),
    t("services.removeDialog.description")
  );

  // Get unique currencies from LOCALE_CURRENCY_MAP
  const uniqueCurrencies = Array.from(
    new Set(Object.values(LOCALE_CURRENCY_MAP))
  ).sort();

  const handleServiceSelection = (
    serviceDefinitionId: string | undefined,
    selectedData?: ServiceDefinitionOptionWithAllLocales
  ) => {
    if (serviceDefinitionId && selectedData) {
      // Populate ALL locales from selectedData
      setNewService((prev) => ({
        ...prev,
        serviceDefinitionId,
        name: { translations: selectedData.name.translations }, // ALL LOCALES
        description: { translations: selectedData.description.translations }, // ALL LOCALES
        price: selectedData.price || 0,
        currency: selectedData.currency || "USD",
        durationMinutes: selectedData.durationMinutes || 0,
      }));
    } else {
      // Clear selection
      setNewService((prev) => ({
        ...prev,
        serviceDefinitionId: "",
        name: createEmptyLocalizedContent(),
        description: createEmptyLocalizedContent(),
        price: 0,
        currency: "",
        durationMinutes: 0,
      }));
    }
  };

  const handleAdd = () => {
    if (!newService.serviceDefinitionId) {
      toast.error(t("services.messages.serviceSelectionRequired"));
      return;
    }

    // Validate price
    if (newService.price < 0) {
      toast.error(t("services.messages.priceRequired"));
      return;
    }

    // Validate currency
    // if (!newService.currency) {
    //   toast.error(t("services.messages.currencyRequired"));
    //   return;
    // }

    // Validate duration
    if (newService.durationMinutes < 0) {
      toast.error(t("services.messages.durationRequired"));
      return;
    }

    // Normalize all localized content
    const normalizedFields = normalizeLocalizedFields({
      name: newService.name,
      description: newService.description,
      notes: newService.notes,
    });
    executeAdd({
      serviceProviderId,
      serviceDefinitionId: newService.serviceDefinitionId,
      name: normalizedFields.name,
      description: normalizedFields.description,
      price: newService.price,
      currency: newService.currency,
      durationMinutes: newService.durationMinutes,
      isActive: true,
      notes: normalizedFields.notes,
    });
  };

  const handleRemove = async (service: ServiceProviderService) => {
    const ok = await confirm();
    if (ok) {
      executeRemove({
        serviceProviderId,
        serviceId: service.serviceDefinitionId,
      });
    }
  };

  const handleEditClick = (service: ServiceProviderService) => {
    setEditingId(service.id);
    setEditFormData({
      serviceId: service.serviceDefinitionId,
      name: service.displayName,
      description: service.description || createEmptyLocalizedContent(),
      price: service.value,
      currency: service.currency,
      durationMinutes: service.durationMinutes,
      isActive: service.isActive ?? true,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({
      serviceId: "",
      name: createEmptyLocalizedContent(),
      description: createEmptyLocalizedContent(),
      price: 0,
      currency: "",
      durationMinutes: 0,
      isActive: true,
    });
  };

  const handleUpdateService = () => {
    if (!editFormData.serviceId) {
      toast.error(t("services.messages.serviceSelectionRequired"));
      return;
    }

    // Validate price
    if (editFormData.price < 0) {
      toast.error(t("services.messages.priceRequired"));
      return;
    }

    // Validate duration
    if (editFormData.durationMinutes < 0) {
      toast.error(t("services.messages.durationRequired"));
      return;
    }

    // Normalize all localized content
    const normalizedFields = normalizeLocalizedFields({
      name: editFormData.name,
      description: editFormData.description,
    });

    executeUpdate({
      serviceProviderId,
      serviceId: editFormData.serviceId,
      name: normalizedFields.name,
      description: normalizedFields.description,
      price: editFormData.price,
      currency: editFormData.currency,
      durationMinutes: editFormData.durationMinutes,
      isActive: editFormData.isActive,
    });
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("services.title")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("services.description")}
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          disabled={isPending || isAdding}
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("services.actions.add")}
        </Button>
      </div>

      {/* Existing services */}
      <div className="grid gap-3">
        {currentServices.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-muted-foreground text-center">
                <DollarSign className="mx-auto mb-2 h-8 w-8" />
                <p>{t("services.noServices")}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          currentServices.map((service) => (
            <Card key={service.id}>
              <CardContent className="pt-4">
                {editingId === service.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <LocalizedInput
                        label={t("services.form.serviceName")}
                        value={editFormData.name}
                        onChange={(value) =>
                          setEditFormData((prev) => ({ ...prev, name: value }))
                        }
                        maxLength={200}
                      />
                    </div>

                    <div className="space-y-2">
                      <LocalizedInput
                        label={t("services.form.serviceDescription")}
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
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {/* Price Input */}
                      <div className="space-y-2">
                        <Label htmlFor={`edit-price-${service.id}`}>
                          {t("services.form.price")}
                          <span className="text-destructive ml-1">*</span>
                        </Label>
                        <Input
                          id={`edit-price-${service.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={editFormData.price}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              price: parseFloat(e.target.value) || 0,
                            }))
                          }
                          placeholder="0.00"
                          disabled={isPending}
                        />
                      </div>

                      {/* Currency Select */}
                      <div className="space-y-2">
                        <Label htmlFor={`edit-currency-${service.id}`}>
                          {t("services.form.currency")}
                          <span className="text-destructive ml-1">*</span>
                        </Label>
                        <Select
                          value={editFormData.currency}
                          onValueChange={(value) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              currency: value,
                            }))
                          }
                          disabled={isPending}
                        >
                          <SelectTrigger id={`edit-currency-${service.id}`}>
                            <SelectValue
                              placeholder={t("services.form.selectCurrency")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {uniqueCurrencies.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Duration Input */}
                      <div className="space-y-2">
                        <Label htmlFor={`edit-duration-${service.id}`}>
                          {t("services.form.duration")}
                          <span className="text-destructive ml-1">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id={`edit-duration-${service.id}`}
                            type="number"
                            min="0"
                            value={editFormData.durationMinutes}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                durationMinutes: parseInt(e.target.value) || 0,
                              }))
                            }
                            placeholder="60"
                            disabled={isPending}
                          />
                          <span className="text-muted-foreground text-sm whitespace-nowrap">
                            {t("services.units.minutesShort")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isPending}
                        size="sm"
                      >
                        {t("services.actions.cancel")}
                      </Button>
                      <Button
                        onClick={handleUpdateService}
                        disabled={isPending}
                        size="sm"
                      >
                        {t("services.actions.save")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">
                          {getLocalizedValue(service.displayName, localeHeader)}
                        </h4>
                        {!service.isActive && (
                          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                            {t("services.status.inactive")}
                          </span>
                        )}
                      </div>

                      {service.description && (
                        <div className="text-muted-foreground text-sm">
                          <LexicalRenderer
                            content={getLocalizedValue(
                              service.description,
                              localeHeader
                            )}
                          />
                        </div>
                      )}

                      <div className="text-muted-foreground flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>
                            {formatPrice(service.value)} {service.currency}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {service.durationMinutes}{" "}
                            {t("services.units.minutesShort")}
                          </span>
                        </div>
                      </div>

                      {service.notes && (
                        <div className="mt-2">
                          <p className="text-muted-foreground text-sm">
                            <strong>{t("services.form.notes")}:</strong>{" "}
                            {getLocalizedValue(service.notes, localeHeader)}
                          </p>
                        </div>
                      )}


                      <div className="mt-4">
  <ImageGalleryManager
    title="Service image gallery"
    description="Add or remove service gallery images."
    listUrl={`/api/v1/service-providers/${serviceProviderId}/services/${service.id}/gallery`}
    uploadUrl={`/api/v1/service-providers/${serviceProviderId}/services/${service.id}/gallery`}
    deleteUrl={(imageId) =>
      `/api/v1/service-providers/${serviceProviderId}/services/${service.id}/gallery/${imageId}`
    }
    disabled={isPending || editingId !== null}
    onUpdate={onUpdate}
  />
</div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(service)}
                        disabled={isPending || editingId !== null}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(service)}
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

      {/* Add service form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("services.add.title")}
            </CardTitle>
            <CardDescription>{t("services.add.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("services.form.serviceDefinition")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <ServiceDefinitionSelectorWithInfiniteScroll
                value={newService.serviceDefinitionId}
                onValueChange={handleServiceSelection}
                options={availableServiceDefinitions || []}
                onSearch={setServiceSearch}
                placeholder={t("services.form.selectService")}
                disabled={isPending}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
                isFetchingNextPage={isFetchingNextPage}
              />
            </div>

            {/* Editable service name and description with LocalizedInput */}
            {newService.serviceDefinitionId && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <LocalizedInput
                    label={t("services.form.serviceName")}
                    value={newService.name}
                    onChange={(value) =>
                      setNewService((prev) => ({ ...prev, name: value }))
                    }
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <LocalizedInput
                    label={t("services.form.serviceDescription")}
                    value={newService.description}
                    onChange={(value) =>
                      setNewService((prev) => ({ ...prev, description: value }))
                    }
                    richText
                    rows={3}
                    maxLength={2000}
                  />
                </div>

                {/* Editable form controls */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Price Input */}
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      {t("services.form.price")}
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newService.price}
                      onChange={(e) =>
                        setNewService((prev) => ({
                          ...prev,
                          price: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="0.00"
                      disabled={isPending}
                    />
                  </div>

                  {/* Currency Select */}
                  <div className="space-y-2">
                    <Label htmlFor="currency">
                      {t("services.form.currency")}
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Select
                      value={newService.currency}
                      onValueChange={(value) =>
                        setNewService((prev) => ({ ...prev, currency: value }))
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue
                          placeholder={t("services.form.selectCurrency")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueCurrencies.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration Input */}
                  <div className="space-y-2">
                    <Label htmlFor="duration">
                      {t("services.form.duration")}
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="duration"
                        type="number"
                        min="0"
                        value={newService.durationMinutes}
                        onChange={(e) =>
                          setNewService((prev) => ({
                            ...prev,
                            durationMinutes: parseInt(e.target.value) || 0,
                          }))
                        }
                        placeholder="60"
                        disabled={isPending}
                      />
                      <span className="text-muted-foreground text-sm whitespace-nowrap">
                        {t("services.units.minutesShort")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">{t("services.form.notes")}</Label>
              <LocalizedInput
                richText
                value={newService.notes}
                onChange={(value) =>
                  setNewService((prev) => ({ ...prev, notes: value }))
                }
                label={t("services.form.notesPlaceholder")}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAdding(false)}
                disabled={isPending}
              >
                {t("services.actions.cancel")}
              </Button>
              <Button
                onClick={handleAdd}
                disabled={isPending || !newService.serviceDefinitionId}
              >
                {t("services.actions.add")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog />
    </div>
  );
}
