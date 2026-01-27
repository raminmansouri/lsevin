"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CloudUpload, Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/form/file-upload";
import { ZodErrorProvider } from "@/components/providers/zod-error-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MAX_FILE_SIZE } from "@/features/shared/types/constants";
import { DocumentType } from "@/features/shared/types/user";
import useAction from "@/hooks/use-action";

import { uploadDocument } from "../actions/upload-document";
import { UploadDocumentSchema } from "../actions/upload-document/schema";
import { InputType, TRANSLATION_KEY } from "../actions/upload-document/types";

export function UserDocumentsForm() {
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);

  const t = useTranslations(TRANSLATION_KEY);
  const commonT = useTranslations("Common");

  const form = useForm<InputType>({
    resolver: zodResolver(UploadDocumentSchema),
    mode: "onSubmit",
    defaultValues: {
      documentType: undefined,
      documentFile: undefined,
    },
  });

  const { execute } = useAction(uploadDocument, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.documentUploadSuccess"));
      form.reset();
      setFile(null);
    },
    onError: (error) => {
      toast.error(error?.detail || t("errors.documentUploadFailed"));
    },
  });

  const dropZoneConfig = {
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [], // Accept all image types
      "application/zip": [".zip"],
    },
  };

  // When file changes in the file uploader, update the form
  const handleFilesChange = (newFiles: File[] | null) => {
    if (newFiles && newFiles.length > 0 && newFiles[0]) {
      const originalName = newFiles[0].name;

      // Generate a UUID filename with original extension
      const extension = originalName.includes(".")
        ? originalName.substring(originalName.lastIndexOf("."))
        : "";
      const uuidName = uuidv4() + extension;

      // Create a new File object with the UUID name
      const processedFile = new File([newFiles[0]], uuidName, {
        type: newFiles[0].type,
      });

      setFile(processedFile);
      form.setValue("documentFile", processedFile, { shouldValidate: true });
    } else {
      setFile(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.setValue("documentFile", undefined as any, {
        shouldValidate: false,
      });
    }
  };

  function onSubmit(values: InputType) {
    startTransition(async () => {
      execute(values);
    });
  }

  return (
    <ZodErrorProvider componentNamespace={TRANSLATION_KEY}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("personalInfo.documents")}</CardTitle>
              <CardDescription>{t("page.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.documentType.label")}</FormLabel>
                    <Select
                      disabled={isPending}
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={commonT("DocumentType.title")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={DocumentType.Passport.toString()}>
                          {commonT("DocumentType.Passport")}
                        </SelectItem>
                        <SelectItem value={DocumentType.Visa.toString()}>
                          {commonT("DocumentType.Visa")}
                        </SelectItem>
                        <SelectItem
                          value={DocumentType.DriverLicense.toString()}
                        >
                          {commonT("DocumentType.DriverLicense")}
                        </SelectItem>
                        <SelectItem
                          value={DocumentType.BankStatement.toString()}
                        >
                          {commonT("DocumentType.BankStatement")}
                        </SelectItem>
                        <SelectItem value={DocumentType.IdCard.toString()}>
                          {commonT("DocumentType.IdCard")}
                        </SelectItem>
                        <SelectItem value={DocumentType.Medical.toString()}>
                          {commonT("DocumentType.Medical")}
                        </SelectItem>
                        <SelectItem value={DocumentType.Beauty.toString()}>
                          {commonT("DocumentType.Beauty")}
                        </SelectItem>
                        <SelectItem value={DocumentType.Tourism.toString()}>
                          {commonT("DocumentType.Tourism")}
                        </SelectItem>
                        <SelectItem value={DocumentType.Other.toString()}>
                          {commonT("DocumentType.Other")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentFile"
                render={() => (
                  <FormItem>
                    <FormLabel>{t("form.documentFile.label")}</FormLabel>
                    <FormControl>
                      <FileUploader
                        value={file ? [file] : null}
                        onValueChange={handleFilesChange}
                        dropzoneOptions={dropZoneConfig}
                        className="bg-background relative rounded-lg p-2"
                      >
                        <FileInput className="outline-1 outline-slate-500 outline-dashed">
                          <div className="flex w-full flex-col items-center justify-center p-8">
                            <CloudUpload className="h-10 w-10 text-gray-500" />
                            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">
                                {t("placeholders.documentFile")}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Images (all formats), PDF, ZIP
                            </p>
                          </div>
                        </FileInput>
                        <FileUploaderContent>
                          {file && (
                            <FileUploaderItem
                              key={0}
                              index={0}
                              className="flex items-center justify-between"
                            >
                              <div className="mr-6 flex items-center">
                                <Paperclip className="mr-2 h-4 w-4 stroke-current" />
                                <span className="max-w-[200px] truncate">
                                  {file.name}
                                </span>
                              </div>
                            </FileUploaderItem>
                          )}
                        </FileUploaderContent>
                      </FileUploader>
                    </FormControl>
                    <FormDescription>
                      {t("errors.supportedFormats", {
                        defaultValue:
                          "Supported formats: Images (all formats), PDF, ZIP (max 5MB)",
                      })}
                    </FormDescription>
                    {/* <FormMessage /> */}
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending} className="ml-auto">
                {t("buttons.upload")}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </ZodErrorProvider>
  );
}

export const UserDocumentsFormSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="ml-auto h-10 w-24" />
      </CardFooter>
    </Card>
  );
};
