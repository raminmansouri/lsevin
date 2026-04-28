"use client";

import { useMemo, useTransition } from "react";
import { ExternalLink, ImageIcon, Save, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ZodErrorProvider } from "@/components/providers/zod-error-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { env } from "@/config/env/client";
import { RHFSingleMediaPickerField } from "@/features/media-picker-addon";
import useAction from "@/hooks/use-action";
import { useRouter } from "@/i18n/navigation";

import { createSponseredSliderAction } from "../actions/create-sponsered-slider";
import { updateSponseredSliderAction } from "../actions/update-sponsered-slider";
import { DEFAULT_SLIDER_BUTTON_LABEL, SPONSERED_SLIDER_TRANSLATION_KEY } from "../constants";
import { SponseredSliderFormInput } from "../schemas";
import type { SponseredSliderDetails, SponseredSliderFormOptions } from "../types";

type Props = {
  item?: SponseredSliderDetails;
  options: SponseredSliderFormOptions;
};

function mediaUrl(value?: string | null) {
  if (!value) return undefined;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) return value;
  return `${env.NEXT_PUBLIC_FILES_URL}/${value}`;
}

function detailsToDefaultValues(item?: SponseredSliderDetails): SponseredSliderFormInput {
  return {
    sliderId: item?.id,
    mediaId: undefined,
    url: item?.url || "",
    mediaTypeId: item?.mediaTypeId || undefined,
    title: item?.title || "",
    subtitle: item?.subtitle || "",
    buttonLabel: item?.buttonLabel || DEFAULT_SLIDER_BUTTON_LABEL,
    link: item?.link || "",
    displayOrder: item?.displayOrder ?? 0,
    isActive: item?.isActive ?? true,
  };
}

export function SponseredSliderForm({ item, options }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(item);

  const defaultValues = useMemo(() => detailsToDefaultValues(item), [item]);

  const form = useForm<SponseredSliderFormInput>({
    defaultValues,
    mode: "onSubmit",
  });

  const action = isEdit ? updateSponseredSliderAction : createSponseredSliderAction;
  const { execute } = useAction(action, {
    startTransition,
    onSuccess: () => {
      console.log("[sponsered-slider] server action success");
      toast.success(isEdit ? "Sponsored slider item updated." : "Sponsored slider item created.");
      router.push("/admin/sponsered-slider");
    },
    onError: (error) => {
      console.error("[sponsered-slider] server action error", error);
      toast.error(error?.detail || "Sponsored slider save failed.");
    },
  });

  const currentUrl = form.watch("url");
  const selectedMediaId = form.watch("mediaId");
  const preview = mediaUrl(currentUrl);

  const onSubmit = async (values: SponseredSliderFormInput) => {
    const payload = {
      ...values,
      title: values.title?.trim() || undefined,
      subtitle: values.subtitle?.trim() || undefined,
      buttonLabel: values.buttonLabel?.trim() || DEFAULT_SLIDER_BUTTON_LABEL,
      link: values.link?.trim() || undefined,
      url: values.url?.trim() || undefined,
      mediaId: values.mediaId?.trim() || undefined,
      mediaTypeId: values.mediaTypeId?.trim() || undefined,
      displayOrder: Number.isFinite(Number(values.displayOrder)) ? Number(values.displayOrder) : 0,
      isActive: Boolean(values.isActive),
    };

    console.groupCollapsed("[sponsered-slider] " + (isEdit ? "update" : "create") + " submit");
    console.log("raw form values", values);
    console.log("payload sent to server action", payload);
    console.groupEnd();

    startTransition(async () => {
      await execute(payload as any);
    });
  };

  const onInvalid = (errors: unknown) => {
    console.groupCollapsed("[sponsered-slider] form submit blocked");
    console.warn("react-hook-form errors", errors);
    console.warn("current form values", form.getValues());
    console.groupEnd();
    toast.error("The form could not be submitted. Check the browser console for details.");
  };

  return (
    <CardContent className="p-6">
      <ZodErrorProvider componentNamespace={SPONSERED_SLIDER_TRANSLATION_KEY}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
            {isEdit && <input type="hidden" {...form.register("sliderId")} />}

            <Card className="overflow-hidden border-gray-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-[#083f30]/5 to-[#eac074]/10">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-[#083f30]/10 p-2 text-[#083f30]">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Home sponsored media</CardTitle>
                    <CardDescription>
                      Pick an image, GIF, or video from the central media manager. The server action stores the selected media file URL in media.sponsered_slider.url.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_340px]">
                <div className="space-y-5">
                  <RHFSingleMediaPickerField
                    control={form.control}
                    name="mediaId"
                    label="Media file"
                    placeholder="Pick image, GIF, or video"
                    mediaType="all"
                    helperText="Stores one media id in a hidden input. On save, the selected media_library.file_url is copied into the slider URL column."
                    modalTitle="Pick sponsored slider media"
                  />

                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Direct media URL / current stored URL</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="uploads/media/banner.webp or https://..." />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Keep this value when editing. Pick a new media file only when you want to replace it.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl><Input {...field} value={field.value || ""} placeholder="Sponsored title" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="buttonLabel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Button label</FormLabel>
                          <FormControl><Input {...field} value={field.value || ""} placeholder="Learn More" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subtitle"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Subtitle</FormLabel>
                          <FormControl><Input {...field} value={field.value || ""} placeholder="Short marketing subtitle" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="link"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>CTA link</FormLabel>
                          <FormControl><Input {...field} value={field.value || ""} placeholder="/n/app/mobile/search-results?q=... or https://..." /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mediaTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Media type</FormLabel>
                          <FormControl>
                            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...field} value={field.value || ""}>
                              <option value="">Auto / none</option>
                              {options.mediaTypes.map((type) => (
                                <option key={type.id} value={type.id}>{type.name || type.id}</option>
                              ))}
                            </select>
                          </FormControl>
                          <p className="text-xs text-muted-foreground">If empty, the server tries to infer from the selected media item.</p>
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
                          <FormControl><Input type="number" min={0} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-2xl border bg-gray-50 p-4 md:col-span-2">
                          <div>
                            <FormLabel>Active</FormLabel>
                            <p className="text-sm text-muted-foreground">Inactive slider items stay in admin but are hidden from the home page carousel.</p>
                          </div>
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="rounded-3xl border bg-gray-50 p-4 shadow-inner">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Preview</p>
                      <p className="text-xs text-muted-foreground">Uses the stored URL field. A newly picked media id previews after save.</p>
                    </div>
                    {selectedMediaId && <span className="rounded-full bg-[#083f30]/10 px-2 py-1 text-xs font-medium text-[#083f30]">new media selected</span>}
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
                    {preview ? (
                      currentUrl?.match(/\.(mp4|webm|mov|m4v)(\?|$)/i) ? (
                        <video src={preview} className="h-full w-full object-cover" controls muted />
                      ) : (
                        <ImageWithFallback fill src={preview} alt={form.watch("title") || "Sponsored media"} className="object-cover" />
                      )
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                        <ImageIcon className="h-10 w-10" />
                        <span className="text-sm">No media URL yet</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 space-y-2 rounded-2xl bg-white p-4 ring-1 ring-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{form.watch("title") || "Slider title"}</p>
                    <p className="text-sm text-muted-foreground">{form.watch("subtitle") || "Slider subtitle will appear here."}</p>
                    <div className="flex items-center gap-2 text-xs font-medium text-[#083f30]">
                      <ExternalLink className="h-3.5 w-3.5" /> {form.watch("buttonLabel") || DEFAULT_SLIDER_BUTTON_LABEL}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-2xl border bg-white/95 p-4 shadow-xl backdrop-blur">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-[#eac074]" /> Sponsored home media will be saved directly to PostgreSQL with server actions.
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => router.push("/admin/sponsered-slider")} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending} className="bg-[#083f30] hover:bg-[#083f30]/90">
                  <Save className="mr-2 h-4 w-4" /> {isPending ? "Saving..." : isEdit ? "Update slider" : "Create slider"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </ZodErrorProvider>
    </CardContent>
  );
}

export function SponseredSliderFormSkeleton() {
  return (
    <CardContent className="space-y-6 p-6">
      <Card>
        <CardHeader><Skeleton className="h-6 w-56" /><Skeleton className="h-4 w-80" /></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-72 w-full md:col-span-2" /></CardContent>
      </Card>
    </CardContent>
  );
}
