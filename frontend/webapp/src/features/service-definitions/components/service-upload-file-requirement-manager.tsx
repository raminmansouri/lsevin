"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, FileUp, Plus, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";

import { LexicalRenderer } from "@/components/editor/lexical-renderer";
import { RHFSingleMediaPickerField } from "@/features/media-picker-addon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

import { addServiceUploadRequirementAction } from "../actions/add-service-upload-requirement";
import { removeServiceUploadRequirementAction } from "../actions/remove-service-upload-requirement";
import { updateServiceUploadRequirementAction } from "../actions/update-service-upload-requirement";
import { useServiceDefinitionDetailsCacheManagement } from "../api/client/get-service-definition-details-query";
import { ServiceUploadRequirementBaseSchema } from "../schemas";
import {
  ServiceDefinitionDetails,
  ServiceDefinitionUploadRequirement,
} from "../types/service-definition";

const UploadRequirementFormSchema = ServiceUploadRequirementBaseSchema.extend({
  allowedExtensionsText: z.string().optional(),
  allowedMimeTypesText: z.string().optional(),
});

type UploadRequirementFormInput = z.infer<typeof UploadRequirementFormSchema>;

interface Props {
  serviceDefinition: ServiceDefinitionDetails;
  onUpdate?: () => void;
}

function toCsv(values: string[]) {
  return values.filter(Boolean).join(", ");
}

function csvToArray(value?: string | null) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function defaultValues(requirement?: ServiceDefinitionUploadRequirement): UploadRequirementFormInput {
  return {
    title: requirement?.title || createEmptyLocalizedContent(),
    description: requirement?.description || createEmptyLocalizedContent(),
    isRequired: requirement?.isRequired ?? false,
    maxFileSizeBytes: requirement?.maxFileSizeBytes ?? 0,
    allowedExtensions: requirement?.allowedExtensions ?? [],
    allowedMimeTypes: requirement?.allowedMimeTypes ?? [],
    allowedExtensionsText: toCsv(requirement?.allowedExtensions ?? []),
    allowedMimeTypesText: toCsv(requirement?.allowedMimeTypes ?? []),
    maxFiles: requirement?.maxFiles ?? 1,
    displayOrder: requirement?.displayOrder ?? 0,
    exampleFileUrl: requirement?.exampleFileUrl || "",
  };
}

export function ServiceUploadFileRequirementManager({ serviceDefinition, onUpdate }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const locale = useLocale();
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const { invalidateServiceDefinitionCache } = useServiceDefinitionDetailsCacheManagement();

  const form = useForm<UploadRequirementFormInput>({
    resolver: zodResolver(UploadRequirementFormSchema),
    defaultValues: defaultValues(),
  });

  const selectedRequirement = useMemo(
    () => serviceDefinition.uploadRequirements.find((item) => item.id === editingId),
    [editingId, serviceDefinition.uploadRequirements]
  );

  const { execute: executeAdd } = useAction(addServiceUploadRequirementAction, {
    startTransition,
    onSuccess: () => {
      toast.success("Upload requirement added.");
      form.reset(defaultValues());
      setIsAdding(false);
      invalidateServiceDefinitionCache(serviceDefinition.id);
      onUpdate?.();
    },
    onError: (error) => toast.error(error.detail || "Could not add upload requirement."),
  });

  const { execute: executeUpdate } = useAction(updateServiceUploadRequirementAction, {
    startTransition,
    onSuccess: () => {
      toast.success("Upload requirement updated.");
      form.reset(defaultValues());
      setEditingId(null);
      invalidateServiceDefinitionCache(serviceDefinition.id);
      onUpdate?.();
    },
    onError: (error) => toast.error(error.detail || "Could not update upload requirement."),
  });

  const { execute: executeRemove } = useAction(removeServiceUploadRequirementAction, {
    startTransition,
    onSuccess: () => {
      toast.success("Upload requirement removed.");
      invalidateServiceDefinitionCache(serviceDefinition.id);
      onUpdate?.();
    },
    onError: (error) => toast.error(error.detail || "Could not remove upload requirement."),
  });

  const [DeleteConfirmDialog, confirmDelete] = useConfirm(
    "Remove upload requirement",
    "This will remove the document/file requirement from the service definition.",
    "destructive"
  );

  const beginAdd = () => {
    setEditingId(null);
    setIsAdding(true);
    form.reset(defaultValues());
  };

  const beginEdit = (requirement: ServiceDefinitionUploadRequirement) => {
    setIsAdding(false);
    setEditingId(requirement.id);
    form.reset(defaultValues(requirement));
  };

  const cancel = () => {
    setIsAdding(false);
    setEditingId(null);
    form.reset(defaultValues());
  };

  const submit = async (values: UploadRequirementFormInput) => {
    const normalizedFields = normalizeLocalizedFields({
      title: values.title,
      description: values.description,
    });

    const payload = {
      ...values,
      ...normalizedFields,
      serviceDefinitionId: serviceDefinition.id,
      allowedExtensions: csvToArray(values.allowedExtensionsText),
      allowedMimeTypes: csvToArray(values.allowedMimeTypesText),
      exampleFileUrl: values.exampleFileUrl || null,
    };

    startTransition(async () => {
      if (editingId) {
        await executeUpdate({ ...payload, requirementId: editingId });
      } else {
        await executeAdd(payload);
      }
    });
  };

  const remove = async (requirementId: string) => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;

    startTransition(async () => {
      await executeRemove({ serviceDefinitionId: serviceDefinition.id, requirementId });
    });
  };

  const showForm = isAdding || editingId;

  return (
    <Card>
      <DeleteConfirmDialog />
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Upload file requirements
          </CardTitle>
          <CardDescription>
            Define files users must upload during booking, such as passport, medical photos, lab results, or consent forms.
          </CardDescription>
        </div>
        {!showForm && (
          <Button type="button" onClick={beginAdd} disabled={isPending}>
            <Plus className="mr-2 h-4 w-4" /> Add requirement
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="space-y-4 rounded-2xl border bg-muted/20 p-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <LocalizedInput label="Title" value={field.value} onChange={field.onChange} required maxLength={200} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <LocalizedInput label="Description" value={field.value} onChange={field.onChange} richText rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FormField
                  control={form.control}
                  name="maxFiles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max files</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" onChange={(event) => field.onChange(Number(event.target.value) || 1)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxFileSizeBytes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max file size bytes</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" onChange={(event) => field.onChange(Number(event.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display order</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" onChange={(event) => field.onChange(Number(event.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isRequired"
                  render={({ field }) => (
                    <FormItem className="flex h-full items-center justify-between rounded-xl border bg-background p-4">
                      <FormLabel>Required</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="allowedExtensionsText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allowed extensions</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="jpg, png, pdf" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allowedMimeTypesText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allowed MIME types</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="image/jpeg, application/pdf" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <RHFSingleMediaPickerField
                control={form.control}
                name="exampleFileUrl"
                label="Example file"
                placeholder="Pick example file"
                mediaType="all"
                helperText="Stores one media id in a hidden input. Use this for sample document/image guidance."
                modalTitle="Pick example file"
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={cancel} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{editingId ? "Update" : "Create"}</Button>
              </div>
            </form>
          </Form>
        )}

        {serviceDefinition.uploadRequirements.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No upload requirements yet.
          </div>
        ) : (
          <div className="space-y-3">
            {serviceDefinition.uploadRequirements.map((requirement) => (
              <div key={requirement.id} className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium">{getLocalizedValue(requirement.title, localeHeader)}</h4>
                      {requirement.isRequired && <Badge>Required</Badge>}
                      <Badge variant="secondary">Max {requirement.maxFiles}</Badge>
                    </div>
                    <LexicalRenderer
                      content={getLocalizedValue(requirement.description, localeHeader)}
                      className="text-sm text-muted-foreground"
                    />
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {requirement.allowedExtensions.length > 0 && <span>Extensions: {toCsv(requirement.allowedExtensions)}</span>}
                      {requirement.allowedMimeTypes.length > 0 && <span>MIME: {toCsv(requirement.allowedMimeTypes)}</span>}
                      {requirement.maxFileSizeBytes > 0 && <span>Max size: {requirement.maxFileSizeBytes} bytes</span>}
                      {requirement.exampleFileUrl && <span>Example media id: {requirement.exampleFileUrl}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => beginEdit(requirement)} disabled={isPending || !!selectedRequirement}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(requirement.id)} disabled={isPending}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
