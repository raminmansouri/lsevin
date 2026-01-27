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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { localeToHeader } from "@/config/locales";
import {
  ServiceDefinitionOption,
  useServiceDefinitionsBySearch,
} from "@/features/service-definitions/api/client/get-service-definitions-by-search";
import { LocalizedDisplay } from "@/features/shared/components/LocalizedDisplay";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import {
  createEmptyLocalizedContent,
  normalizeLocalizedContent,
} from "@/features/shared/utils/localization";
import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";
import { formatPrice } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { LocaleTypes } from "@/types/common";

import { addStaffServiceAction } from "../actions/add-staff-service";
import { removeStaffServiceAction } from "../actions/remove-staff-service";
import { updateStaffServiceAction } from "../actions/update-staff-service";
import { useStaffDetailsCacheManagement } from "../api/client/get-staff-details-query";
import { STAFF_TRANSLATION_KEY } from "../constants";
import { StaffDetails, StaffServiceResponse } from "../types";

interface StaffServiceManagerProps {
  staff: StaffDetails;
  onUpdate?: () => void;
}

// ServiceDefinitionSelectorWithInfiniteScroll component
interface ServiceDefinitionSelectorWithInfiniteScrollProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  options: ServiceDefinitionOption[];
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

  const formatDisplayName = (option: ServiceDefinitionOption) => {
    return option.name;
  };

  const formatDescription = (option: ServiceDefinitionOption) => {
    const parts = [];
    if (option.categoryName) parts.push(option.categoryName);
    if (option.price && option.currency)
      parts.push(`${option.price} ${option.currency}`);
    if (option.durationMinutes)
      parts.push(`${option.durationMinutes} ${t("units.minutesShort")}`);
    return parts.join(" • ");
  };

  const handleSelect = (optionId: string) => {
    if (value === optionId) {
      onValueChange?.(undefined);
    } else {
      onValueChange?.(optionId);
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
                  value={option.name}
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
                        <LexicalRenderer content={option.description} />
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

export function StaffServiceManager({
  staff,
  onUpdate,
}: StaffServiceManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const locale = useLocale();
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const t = useTranslations(STAFF_TRANSLATION_KEY);
  const { invalidateStaffCache } = useStaffDetailsCacheManagement();

  // Use React Query for infinite scroll service definitions
  const {
    data: serviceDefinitionOptions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useServiceDefinitionsBySearch(serviceSearch, locale);

  // Form state for new service
  const [newService, setNewService] = useState({
    serviceDefinitionId: "",
    notes: createEmptyLocalizedContent(),
  });

  // Edit state management
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    serviceId: "",
    isActive: true,
    notes: createEmptyLocalizedContent(),
    serviceDefinitionId: "",
  });

  const { execute: executeAdd } = useAction(addStaffServiceAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.serviceAddSuccess"));
      setIsAdding(false);
      setNewService({
        serviceDefinitionId: "",
        notes: createEmptyLocalizedContent(),
      });
      invalidateStaffCache(staff.id);
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("messages.serviceAddError"));
    },
  });

  const { execute: executeRemove } = useAction(removeStaffServiceAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.serviceRemoveSuccess"));
      invalidateStaffCache(staff.id);
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("messages.serviceRemoveError"));
    },
  });

  const { execute: executeUpdate } = useAction(updateStaffServiceAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.serviceUpdateSuccess"));
      setEditingId(null);
      setEditFormData({
        serviceId: "",
        isActive: true,
        notes: createEmptyLocalizedContent(),
        serviceDefinitionId: "",
      });
      invalidateStaffCache(staff.id);
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("messages.serviceUpdateError"));
    },
  });

  const [ConfirmDialog, confirm] = useConfirm(
    t("services.removeDialog.title"),
    t("services.removeDialog.description")
  );

  const handleAdd = () => {
    if (!newService.serviceDefinitionId) {
      toast.error(t("messages.serviceSelectionRequired"));
      return;
    }

    const normalizedNotes = normalizeLocalizedContent(newService.notes);

    executeAdd({
      staffId: staff.id,
      serviceDefinitionId: newService.serviceDefinitionId,
      notes: normalizedNotes,
    });
  };

  const handleRemove = async (service: StaffServiceResponse) => {
    const ok = await confirm();
    if (ok) {
      executeRemove({
        staffId: staff.id,
        serviceId: service.id,
      });
    }
  };

  const handleEditClick = (service: StaffServiceResponse) => {
    setEditingId(service.id);
    setEditFormData({
      serviceId: service.id,
      isActive: service.isActive,
      notes: service.notes,
      serviceDefinitionId: service.serviceDefinitionId,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({
      serviceId: "",
      isActive: true,
      notes: createEmptyLocalizedContent(),
      serviceDefinitionId: "",
    });
  };

  const handleUpdateService = () => {
    const normalizedNotes = normalizeLocalizedContent(editFormData.notes);

    executeUpdate({
      staffId: staff.id,
      serviceId: editFormData.serviceId,
      isActive: editFormData.isActive,
      notes: normalizedNotes,
      serviceDefinitionId: editFormData.serviceDefinitionId || undefined,
    });
  };

  return (
    <div className="space-y-6">
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
        {staff.services.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-muted-foreground text-center">
                <DollarSign className="mx-auto mb-2 h-8 w-8" />
                <p>{t("services.noServices")}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          staff.services.map((service) => (
            <Card key={service.id}>
              <CardContent className="pt-4">
                {editingId === service.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{service.serviceName}</h4>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("services.form.serviceDefinition")}
                        <span className="text-destructive ml-1">*</span>
                      </Label>
                      <ServiceDefinitionSelectorWithInfiniteScroll
                        value={editFormData.serviceDefinitionId}
                        onValueChange={(value) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            serviceDefinitionId: value || "",
                          }))
                        }
                        options={serviceDefinitionOptions}
                        onSearch={setServiceSearch}
                        placeholder={t("services.form.selectService")}
                        disabled={isPending}
                        hasNextPage={hasNextPage}
                        fetchNextPage={fetchNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                      />
                    </div>

                    <div className="space-y-2">
                      <LocalizedInput
                        label={t("services.form.notes")}
                        value={editFormData.notes}
                        onChange={(value) =>
                          setEditFormData((prev) => ({ ...prev, notes: value }))
                        }
                        richText
                        rows={3}
                        maxLength={500}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isPending}
                        size="sm"
                      >
                        {t("actions.cancel")}
                      </Button>
                      <Button
                        onClick={handleUpdateService}
                        disabled={
                          isPending || !editFormData.serviceDefinitionId
                        }
                        size="sm"
                      >
                        {t("actions.save")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{service.serviceName}</h4>
                        {/* <Badge
                          variant={service.isActive ? "default" : "secondary"}
                        >
                          {service.isActive
                            ? t("status.active")
                            : t("status.inactive")}
                        </Badge> */}
                      </div>

                      {service.serviceDescription && (
                        <div className="text-muted-foreground text-sm">
                          <LexicalRenderer
                            content={service.serviceDescription}
                          />
                        </div>
                      )}

                      <div className="text-muted-foreground flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatPrice(service.price)} USD</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {service.durationInMinutes}{" "}
                            {t("units.minutesShort")}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="text-muted-foreground text-sm">
                          <strong>{t("services.form.notes")}:</strong>
                        </p>
                        <LocalizedDisplay
                          content={service.notes}
                          currentLocale={localeHeader}
                          richText
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
                onValueChange={(value) =>
                  setNewService((prev) => ({
                    ...prev,
                    serviceDefinitionId: value || "",
                  }))
                }
                options={serviceDefinitionOptions}
                onSearch={setServiceSearch}
                placeholder={t("services.form.selectService")}
                disabled={isPending}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
                isFetchingNextPage={isFetchingNextPage}
              />
            </div>

            <div className="space-y-2">
              <LocalizedInput
                label={t("services.form.notes")}
                value={newService.notes}
                onChange={(value) =>
                  setNewService((prev) => ({ ...prev, notes: value }))
                }
                richText
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAdding(false)}
                disabled={isPending}
              >
                {t("actions.cancel")}
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

      {/* Note: With infinite scroll, we no longer show "all services assigned" message
          as there might be more services available through pagination */}

      <ConfirmDialog />
    </div>
  );
}
