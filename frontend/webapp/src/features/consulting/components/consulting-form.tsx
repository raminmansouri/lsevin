"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ZodErrorProvider } from "@/components/providers/zod-error-provider";
import { CategorySelectorWithInfiniteScroll } from "@/components/selectors/category-selector-with-infinite-scroll";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { env } from "@/config/env/client";
import { useCategoriesBySearch } from "@/features/categories/api/client";
import { IUserDocuments } from "@/features/shared/types/user";
import useAction from "@/hooks/use-action";
import { Link } from "@/i18n/navigation";

import { createConsultingRequest } from "../actions/create-consulting-request";
import { CreateConsultingRequestSchema } from "../actions/create-consulting-request/schema";
import { InputType } from "../actions/create-consulting-request/types";
import { TRANSLATION_KEY } from "../types/constants";

type Props = {
  documents: IUserDocuments[];
};

export function ConsultingForm({ documents }: Props) {
  const [isPending, startTransition] = useTransition();
  const [categorySearch, setCategorySearch] = useState("");
  const router = useRouter();
  const locale = useLocale();

  const t = useTranslations(TRANSLATION_KEY);
  const commonT = useTranslations("Common");

  // Use React Query for category search with infinite scroll
  const {
    data: categoryOptions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCategoriesBySearch(categorySearch, locale);

  const form = useForm<InputType>({
    resolver: zodResolver(CreateConsultingRequestSchema),
    mode: "onSubmit",
    defaultValues: {
      description: "",
      categoryId: "",
      categoryName: "",
      documentIds: [],
    },
  });

  const { execute } = useAction(createConsultingRequest, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.createSuccess"));
      form.reset();
      router.push("/");
    },
    onError: (error) => {
      toast.error(error?.detail || t("errors.createFailed"));
    },
  });

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
              <CardTitle>{t("form.formTitle")}</CardTitle>
              <CardDescription>{t("form.formDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.categoryId.label")}</FormLabel>
                    <FormControl>
                      <CategorySelectorWithInfiniteScroll
                        value={field.value}
                        onValueChange={field.onChange}
                        onCategoryChange={(categoryId, categoryName) => {
                          field.onChange(categoryId);
                          form.setValue("categoryName", categoryName || "");
                        }}
                        options={categoryOptions}
                        onSearch={setCategorySearch}
                        placeholder={t("placeholders.category")}
                        disabled={isPending}
                        hasNextPage={hasNextPage}
                        fetchNextPage={fetchNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        searchPlaceholder={t("placeholders.searchCategory")}
                        emptyMessage={t("messages.noCategories")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hidden field for categoryName */}
              <FormField
                control={form.control}
                name="categoryName"
                render={({ field }) => <input {...field} type="hidden" />}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.description.label")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("placeholders.description")}
                        className="min-h-32"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("descriptions.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="documentIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <FormLabel>{t("form.documentIds.label")}</FormLabel>
                            <FormDescription>
                              {t("descriptions.documents")}
                            </FormDescription>
                          </div>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            asChild
                          >
                            <Link href="/profile?tab=documents">
                              {t("buttons.uploadDocuments")}
                            </Link>
                          </Button>
                        </div>
                      </div>
                      {documents.length === 0 ? (
                        <div className="bg-background rounded-md border p-4 text-center">
                          <p className="text-muted-foreground text-sm">
                            {t("messages.noDocuments")}
                          </p>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() =>
                              router.push("/profile?tab=documents")
                            }
                          >
                            {t("buttons.uploadDocuments")}
                          </Button>
                        </div>
                      ) : (
                        <div className="rounded-md border p-4">
                          <div className="grid gap-3">
                            {documents.map((document) => (
                              <FormField
                                key={document.id}
                                control={form.control}
                                name="documentIds"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={document.id}
                                      className="flex flex-row items-center space-y-0 space-x-2"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            document.id
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...(field.value || []),
                                                  document.id,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) =>
                                                      value !== document.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {commonT(
                                          `DocumentType.${document.type}`
                                        )}
                                      </FormLabel>
                                      {document.url && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          asChild
                                        >
                                          <Link
                                            href={`${env.NEXT_PUBLIC_FILES_URL}/${document.url}`}
                                            target="_blank"
                                          >
                                            <ExternalLink className="size-2" />
                                            <span className="sr-only">
                                              View document
                                            </span>
                                          </Link>
                                        </Button>
                                      )}
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending} className="ml-auto">
                {t("buttons.submit")}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </ZodErrorProvider>
  );
}

export const ConsultingFormSkeleton = () => {
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
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="ml-auto h-10 w-24" />
      </CardFooter>
    </Card>
  );
};
