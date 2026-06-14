'use client';


import { useTranslations } from "next-intl";
import { useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RHFSingleMediaPickerField } from '@/features/media-picker-addon';
import { LocalizedInput } from '@/features/shared/components/LocalizedInput';
import { createEmptyLocalizedContent, normalizeLocalizedFields } from '@/features/shared/utils/localization';
import { useRouter } from '@/i18n/navigation';

import { upsertHomeSectionAction } from '../actions';
import { HomeSectionFormSchema, type HomeSectionFormInput } from '../actions/schema';
import type { AdminHomeSection } from '../types';

export function HomeSectionForm({ section }: { section: AdminHomeSection }) {
  const tAdmin = useTranslations("AdminGenerated");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<HomeSectionFormInput>({
    resolver: zodResolver(HomeSectionFormSchema),
    defaultValues: {
      sectionKey: section.sectionKey,
      badge: section.badge || createEmptyLocalizedContent(),
      title: section.title || createEmptyLocalizedContent(),
      subtitle: section.subtitle || createEmptyLocalizedContent(),
      description: section.description || createEmptyLocalizedContent(),
      buttonLabel: section.buttonLabel || createEmptyLocalizedContent(),
      buttonHref: section.buttonHref || '',
      imageUrl: section.imageUrl || '',
      iconName: section.iconName || '',
      displayOrder: section.displayOrder ?? 0,
      isActive: section.isActive ?? true,
      metadata: section.metadata || '{}',
    },
  });

  const onSubmit = (values: HomeSectionFormInput) => {
    const normalized = normalizeLocalizedFields({
      badge: values.badge,
      title: values.title,
      subtitle: values.subtitle,
      description: values.description,
      buttonLabel: values.buttonLabel,
    });

    startTransition(async () => {
      try {
        await upsertHomeSectionAction({
          ...values,
          ...normalized,
          buttonHref: values.buttonHref?.trim() || '',
          imageUrl: values.imageUrl?.trim() || '',
          iconName: values.iconName?.trim() || '',
          metadata: values.metadata?.trim() || '{}',
        });
        toast.success(tAdmin("homeSectionSaved"));
        router.push('/admin/home-sections');
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save home section.');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tAdmin("editHomeSection")}</CardTitle>
        <CardDescription>
          Manage the text, media, link, and active state for <span className="font-mono">{section.sectionKey}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="sectionKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("sectionKey")}</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly disabled className="font-mono" />
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
                    <FormLabel>{tAdmin("displayOrder")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex h-[72px] items-center justify-between rounded-xl border px-4">
                    <div>
                      <FormLabel>{tAdmin("active")}</FormLabel>
                      <p className="text-xs text-muted-foreground">{tAdmin("hiddenSectionsFallBackToSafeDefaultsOnTheApp")}</p>
                    </div>
                    <FormControl>
                      <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="badge"
              render={({ field }) => (
                <FormItem>
                  <LocalizedInput label={tAdmin("badgeEyebrowText")} value={field.value} onChange={field.onChange} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <LocalizedInput label={tAdmin("title")} value={field.value} onChange={field.onChange} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <LocalizedInput
                    label={tAdmin("subtitle")}
                    value={field.value}
                    onChange={field.onChange}
                    multiline
                    rows={2}
                    description="For Explore Nearby you may use {count}, for example: {count} providers ready to discover."
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <LocalizedInput
                    label={tAdmin("description")}
                    value={field.value}
                    onChange={field.onChange}
                    richText
                    rows={4}
                    description="Stored as Lexical JSON, rendered with LexicalRenderer on the home page."
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="buttonLabel"
              render={({ field }) => (
                <FormItem>
                  <LocalizedInput label={tAdmin("buttonLabel")} value={field.value} onChange={field.onChange} />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="buttonHref"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("buttonLinkHref")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="/n/app/mobile/offers" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iconName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("iconName")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder={tAdmin("sparklesGiftMap")} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <RHFSingleMediaPickerField
              control={form.control}
              name="imageUrl"
              label={tAdmin("sectionImage")}
              placeholder={tAdmin("pickImage")}
              mediaType="image"
              helperText="Stores the selected media id. The app resolves it through media.media_library and NEXT_PUBLIC_FILES_URL."
              disabled={isPending}
            />

            <FormField
              control={form.control}
              name="metadata"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAdmin("metadataJSON")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || '{}'} rows={8} className="font-mono text-xs" disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save section'}</Button>
              <Button type="button" variant="outline" disabled={isPending} onClick={() => router.push('/admin/home-sections')}>Cancel</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
