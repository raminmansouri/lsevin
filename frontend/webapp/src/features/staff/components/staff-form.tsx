"use client";

import { useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Award,
  BriefcaseBusiness,
  CalendarClock,
  GraduationCap,
  ImageIcon,
  Languages,
  Plus,
  Save,
  Sparkles,
  Stethoscope,
  Trash2,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { ZodErrorProvider } from "@/components/providers/zod-error-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { RHFSingleMediaPickerField, RHFMultiMediaPickerField } from "@/features/media-picker-addon";
import { RHFLazySearchableSelectField } from "@/features/admin-lazy-select";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import { normalizeLocalizedFields } from "@/features/shared/utils/localization";
import useAction from "@/hooks/use-action";
import { useRouter } from "@/i18n/navigation";

import { createStaffAction } from "../actions/create-staff";
import { updateStaffAction } from "../actions/update-staff";
import { STAFF_TRANSLATION_KEY } from "../constants";
import { StaffFormInput, StaffSchema } from "../schemas";
import { DayOfWeek, StaffDetails, StaffFormOptions } from "../types";

type StaffFormProps = {
  staff?: StaffDetails;
  options: StaffFormOptions;
  locale?: string;
};

const STAFF_TRANSLATION_LOCALES = ["ar-SA", "de-DE", "en-US", "es-ES", "fa-IR", "fr-FR", "ku-KU", "tr-TR"] as const;

const LOCALE_ALIASES: Record<string, string> = {
  ar: "ar-SA",
  "ar-sa": "ar-SA",
  de: "de-DE",
  "de-de": "de-DE",
  en: "en-US",
  "en-us": "en-US",
  es: "es-ES",
  "es-es": "es-ES",
  fa: "fa-IR",
  "fa-ir": "fa-IR",
  fr: "fr-FR",
  "fr-fr": "fr-FR",
  ku: "ku-KU",
  "ku-ku": "ku-KU",
  tr: "tr-TR",
  "tr-tr": "tr-TR",
};

function emptyLocalized() {
  return Object.fromEntries(STAFF_TRANSLATION_LOCALES.map((locale) => [locale, ""])) as Record<string, string>;
}

function normalizeStaffLocalized(value: unknown) {
  const normalized = emptyLocalized();
  if (!value || typeof value !== "object" || Array.isArray(value)) return normalized;

  for (const [rawKey, rawValue] of Object.entries(value as Record<string, unknown>)) {
    const lookupKey = rawKey.trim().replace(/_/g, "-").toLowerCase();
    const key = LOCALE_ALIASES[lookupKey] || rawKey.trim();
    if (!key) continue;
    normalized[key] = typeof rawValue === "string" ? rawValue : rawValue == null ? "" : String(rawValue);
  }

  return normalized;
}

const defaultAvailabilityStatusId = (options: StaffFormOptions) => options.availabilityStatuses[0]?.id ?? 1;

function detailsToDefaultValues(staff: StaffDetails | undefined, options: StaffFormOptions): StaffFormInput {
  return {
    staffId: staff?.id,
    name: normalizeStaffLocalized(staff?.name),
    biography: normalizeStaffLocalized(staff?.biography),
    title: normalizeStaffLocalized(staff?.title),
    profileImageUrl: staff?.profileImageUrl || "",
    isActive: staff?.isActive ?? true,
    experience: staff?.experience || "",
    patients: staff?.patients || "",
    rating: staff?.rating ?? 0,
    specialty: staff?.specialty || "",
    consultationFee: staff?.consultationFee ?? 0,
    nextAvailableLabel: staff?.nextAvailableLabel || "",
    reviewCount: staff?.reviewCount ?? 0,
    specialtyTranslations: normalizeStaffLocalized(staff?.specialtyTranslations),
    experienceYears: staff?.experienceYears ?? undefined,
    successRate: staff?.successRate || "",
    providerAssignments:
      staff?.providerAssignments?.map((item) => ({
        id: item.id,
        serviceProviderId: item.serviceProviderId,
        notes: normalizeStaffLocalized(item.notes),
        isActive: item.isActive,
      })) || [],
    services:
      staff?.services?.map((item) => ({
        id: item.id,
        serviceDefinitionId: item.serviceDefinitionId,
        notes: normalizeStaffLocalized(item.notes),
        isActive: item.isActive,
      })) || [],
    availabilities:
      staff?.availabilities?.map((item) => ({
        id: item.id,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        isRecurring: item.isRecurring,
        specificDate: item.specificDate?.slice(0, 10) || "",
        availabilityStatusId: item.availabilityStatusId,
      })) || [],
    languages: staff?.languages || [],
    specializations: staff?.specializations || [],
    education: staff?.education || [],
    certifications: staff?.certifications || [],
    credentials: staff?.credentials || [],
    achievements: staff?.achievements || [],
    galleryItems:
      staff?.galleryItems?.map((item) => ({
        id: item.id,
        title: normalizeStaffLocalized(item.title),
        description: normalizeStaffLocalized(item.description),
        url: item.url,
        mediaType: item.mediaType || "image",
        displayOrder: item.displayOrder || 0,
        isPrimary: item.isPrimary || false,
      })) || [],
    galleryBulkMediaIds: "",
    beforeAfterItems: staff?.beforeAfterItems || [],
  };
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function SectionHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-2xl bg-[#083f30]/10 p-2 text-[#083f30]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </div>
    </div>
  );
}

function ArrayItemShell({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="rounded-2xl border bg-white/70 p-4 shadow-sm">
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Remove
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

export function StaffForm({ staff, options, locale = "en-US" }: StaffFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!staff;

  const defaultValues = useMemo(() => detailsToDefaultValues(staff, options), [staff, options]);

  const form = useForm<StaffFormInput>({
    defaultValues,
    resolver: zodResolver(StaffSchema),
    mode: "onSubmit",
  });

  const providerAssignments = useFieldArray({ control: form.control, name: "providerAssignments" });
  const services = useFieldArray({ control: form.control, name: "services" });
  const availabilities = useFieldArray({ control: form.control, name: "availabilities" });
  const education = useFieldArray({ control: form.control, name: "education" });
  const certifications = useFieldArray({ control: form.control, name: "certifications" });
  const credentials = useFieldArray({ control: form.control, name: "credentials" });
  const achievements = useFieldArray({ control: form.control, name: "achievements" });
  const galleryItems = useFieldArray({ control: form.control, name: "galleryItems" });
  const beforeAfterItems = useFieldArray({ control: form.control, name: "beforeAfterItems" });

  const action = isEdit ? updateStaffAction : createStaffAction;
  const { execute } = useAction(action, {
    startTransition,
    onSuccess: () => {
      toast.success(isEdit ? "Staff profile updated." : "Staff profile created.");
      router.push("/admin/staff");
    },
    onError: (error) => toast.error(error?.detail || "Staff save failed."),
  });

  const onSubmit = async (values: StaffFormInput) => {
    const normalized = normalizeLocalizedFields({
      name: values.name,
      biography: values.biography,
      title: values.title,
      specialtyTranslations: values.specialtyTranslations || emptyLocalized(),
    });

    const payload = {
      ...values,
      ...normalized,
      languages: values.languages.map((item) => item.trim()).filter(Boolean),
      specializations: values.specializations.map((item) => item.trim()).filter(Boolean),
      profileImageUrl: values.profileImageUrl?.trim() || undefined,
      galleryItems: values.galleryItems.map((item, index) => ({
        ...item,
        displayOrder: item.displayOrder ?? index,
      })),
    };

    startTransition(async () => {
      await execute(payload as any);
    });
  };

  const languagesValue = form.watch("languages").join(", ");
  const specializationsValue = form.watch("specializations").join(", ");

  return (
    <CardContent className="p-6">
      <ZodErrorProvider componentNamespace={STAFF_TRANSLATION_KEY}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {isEdit && <input type="hidden" {...form.register("staffId")} />}

            <Card className="overflow-hidden border-gray-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-[#083f30]/5 to-[#eac074]/10">
                <SectionHeader icon={UserRound} title="Core profile" description="Main doctor, specialist, or staff identity shown across the application." />
              </CardHeader>
              <CardContent className="grid gap-5 p-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <RHFSingleMediaPickerField
                    control={form.control}
                    name="profileImageUrl"
                    label="Profile image"
                    placeholder="Pick image"
                    mediaType="image"
                    helperText="Stores the selected media id/path in category.staff.profile_image_url."
                    modalTitle="Pick profile image"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <LocalizedInput label="Name" value={field.value} onChange={field.onChange} required maxLength={100} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <LocalizedInput label="Professional title" value={field.value} onChange={field.onChange} required maxLength={150} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="biography"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <LocalizedInput label="Biography" value={field.value} onChange={field.onChange} richText rows={5} maxLength={2500} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialtyTranslations"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <LocalizedInput label="Localized specialty" value={normalizeStaffLocalized(field.value)} onChange={field.onChange} maxLength={200} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField control={form.control} name="specialty" render={({ field }) => (
                  <FormItem><FormLabel>Fallback specialty</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Plastic surgery, Dentistry, IVF..." /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="experience" render={({ field }) => (
                  <FormItem><FormLabel>Experience label</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="15+ years" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="experienceYears" render={({ field }) => (
                  <FormItem><FormLabel>Experience years</FormLabel><FormControl><Input type="number" min={0} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="patients" render={({ field }) => (
                  <FormItem><FormLabel>Patients label</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="2,000+" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="rating" render={({ field }) => (
                  <FormItem><FormLabel>Rating</FormLabel><FormControl><Input type="number" min={0} max={5} step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="reviewCount" render={({ field }) => (
                  <FormItem><FormLabel>Review count</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="consultationFee" render={({ field }) => (
                  <FormItem><FormLabel>Consultation fee</FormLabel><FormControl><Input type="number" min={0} step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="successRate" render={({ field }) => (
                  <FormItem><FormLabel>Success rate</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="98%" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="nextAvailableLabel" render={({ field }) => (
                  <FormItem><FormLabel>Next available label</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Tomorrow morning" /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-2xl border bg-gray-50 p-4 md:col-span-2">
                    <div><FormLabel>Active</FormLabel><p className="text-sm text-muted-foreground">Inactive staff will not be available for new provider/service assignment flows.</p></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader><SectionHeader icon={Languages} title="Languages and specializations" description="Stored in staff_languages and staff_specializations." /></CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <FormLabel>Languages</FormLabel>
                  <Input value={languagesValue} onChange={(event) => form.setValue("languages", splitCsv(event.target.value), { shouldDirty: true })} placeholder="English, Persian, Arabic, Turkish" />
                  <p className="text-xs text-muted-foreground">Comma-separated values.</p>
                </div>
                <div className="space-y-2">
                  <FormLabel>Specializations</FormLabel>
                  <Input value={specializationsValue} onChange={(event) => form.setValue("specializations", splitCsv(event.target.value), { shouldDirty: true })} placeholder="Rhinoplasty, Hair transplant, Dental implant" />
                  <p className="text-xs text-muted-foreground">Comma-separated values.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <SectionHeader icon={BriefcaseBusiness} title="Provider assignments" description="Connect staff to one or more service providers." />
                <Button type="button" variant="outline" onClick={() => providerAssignments.append({ serviceProviderId: "", notes: emptyLocalized(), isActive: true })}><Plus className="mr-2 h-4 w-4" /> Add provider</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {providerAssignments.fields.length === 0 && <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No provider assigned yet.</p>}
                {providerAssignments.fields.map((field, index) => (
                  <ArrayItemShell key={field.id} onRemove={() => providerAssignments.remove(index)}>
                    <RHFLazySearchableSelectField
                      control={form.control}
                      name={`providerAssignments.${index}.serviceProviderId` as any}
                      label="Provider"
                      resource="serviceProviders"
                      locale={locale}
                      placeholder="Search and select provider"
                      disabled={isPending}
                    />
                    <FormField control={form.control} name={`providerAssignments.${index}.isActive`} render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-xl border p-3"><FormLabel>Active assignment</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name={`providerAssignments.${index}.notes`} render={({ field }) => (
                      <FormItem className="md:col-span-2"><LocalizedInput label="Provider notes" value={field.value} onChange={field.onChange} rows={3} /><FormMessage /></FormItem>
                    )} />
                  </ArrayItemShell>
                ))}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <SectionHeader icon={Stethoscope} title="Service definitions" description="Services this staff member can perform." />
                <Button type="button" variant="outline" onClick={() => services.append({ serviceDefinitionId: "", notes: emptyLocalized(), isActive: true })}><Plus className="mr-2 h-4 w-4" /> Add service</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.fields.length === 0 && <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No service assigned yet.</p>}
                {services.fields.map((field, index) => (
                  <ArrayItemShell key={field.id} onRemove={() => services.remove(index)}>
                    <RHFLazySearchableSelectField
                      control={form.control}
                      name={`services.${index}.serviceDefinitionId` as any}
                      label="Service definition"
                      resource="serviceDefinitions"
                      locale={locale}
                      placeholder="Search and select service"
                      disabled={isPending}
                    />
                    <FormField control={form.control} name={`services.${index}.isActive`} render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-xl border p-3"><FormLabel>Active service</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name={`services.${index}.notes`} render={({ field }) => (
                      <FormItem className="md:col-span-2"><LocalizedInput label="Service notes" value={field.value} onChange={field.onChange} rows={3} /><FormMessage /></FormItem>
                    )} />
                  </ArrayItemShell>
                ))}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <SectionHeader icon={CalendarClock} title="Availability" description="Recurring weekly slots or one-off dated availability." />
                <Button type="button" variant="outline" onClick={() => availabilities.append({ dayOfWeek: DayOfWeek.Monday, startTime: "09:00:00", endTime: "17:00:00", isRecurring: true, availabilityStatusId: defaultAvailabilityStatusId(options), specificDate: "" })}><Plus className="mr-2 h-4 w-4" /> Add slot</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {availabilities.fields.length === 0 && <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No availability slot defined yet.</p>}
                {availabilities.fields.map((field, index) => {
                  const isRecurring = form.watch(`availabilities.${index}.isRecurring`);
                  return (
                    <ArrayItemShell key={field.id} onRemove={() => availabilities.remove(index)}>
                      <RHFLazySearchableSelectField
                        control={form.control}
                        name={`availabilities.${index}.dayOfWeek` as any}
                        label="Day"
                        resource="daysOfWeek"
                        locale={locale}
                        placeholder="Search and select day"
                        disabled={isPending}
                      />
                      <RHFLazySearchableSelectField
                        control={form.control}
                        name={`availabilities.${index}.availabilityStatusId` as any}
                        label="Status"
                        resource="staffAvailabilityStatuses"
                        locale={locale}
                        placeholder="Search and select status"
                        disabled={isPending}
                      />
                      <FormField control={form.control} name={`availabilities.${index}.startTime`} render={({ field }) => (
                        <FormItem><FormLabel>Start time</FormLabel><FormControl><Input {...field} placeholder="09:00:00" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`availabilities.${index}.endTime`} render={({ field }) => (
                        <FormItem><FormLabel>End time</FormLabel><FormControl><Input {...field} placeholder="17:00:00" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`availabilities.${index}.isRecurring`} render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl border p-3"><FormLabel>Recurring weekly</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                      )} />
                      {!isRecurring && <FormField control={form.control} name={`availabilities.${index}.specificDate`} render={({ field }) => (
                        <FormItem><FormLabel>Specific date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                      )} />}
                    </ArrayItemShell>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <SectionHeader icon={GraduationCap} title="Education, certifications and credentials" />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => education.append({ degree: "", institution: "", year: undefined, imageUrl: "" })}><Plus className="mr-2 h-4 w-4" /> Education</Button>
                  <Button type="button" variant="outline" onClick={() => certifications.append({ name: "", issuer: "", isVerified: false, imageUrl: "" })}><Plus className="mr-2 h-4 w-4" /> Certification</Button>
                  <Button type="button" variant="outline" onClick={() => credentials.append({ credential: "", isVerified: false, imageUrl: "" })}><Plus className="mr-2 h-4 w-4" /> Credential</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {education.fields.map((field, index) => (
                  <ArrayItemShell key={field.id} onRemove={() => education.remove(index)}>
                    <div className="md:col-span-2">
                      <RHFSingleMediaPickerField
                        control={form.control}
                        name={`education.${index}.imageUrl` as any}
                        label="Education image"
                        placeholder="Pick degree/certificate image"
                        mediaType="image"
                        helperText="Stores one media id/path in category.staff_education.image_url."
                        modalTitle="Pick education image"
                      />
                    </div>
                    <FormField control={form.control} name={`education.${index}.degree`} render={({ field }) => <FormItem><FormLabel>Degree</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name={`education.${index}.institution`} render={({ field }) => <FormItem><FormLabel>Institution</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name={`education.${index}.year`} render={({ field }) => <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
                  </ArrayItemShell>
                ))}
                {certifications.fields.map((field, index) => (
                  <ArrayItemShell key={field.id} onRemove={() => certifications.remove(index)}>
                    <div className="md:col-span-2">
                      <RHFSingleMediaPickerField
                        control={form.control}
                        name={`certifications.${index}.imageUrl` as any}
                        label="Certification image"
                        placeholder="Pick certificate image"
                        mediaType="image"
                        helperText="Stores one media id/path in category.staff_certifications.image_url."
                        modalTitle="Pick certification image"
                      />
                    </div>
                    <FormField control={form.control} name={`certifications.${index}.name`} render={({ field }) => <FormItem><FormLabel>Certification</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name={`certifications.${index}.issuer`} render={({ field }) => <FormItem><FormLabel>Issuer</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name={`certifications.${index}.isVerified`} render={({ field }) => <FormItem className="flex items-center justify-between rounded-xl border p-3"><FormLabel>Verified</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} />
                  </ArrayItemShell>
                ))}
                {credentials.fields.map((field, index) => (
                  <ArrayItemShell key={field.id} onRemove={() => credentials.remove(index)}>
                    <div className="md:col-span-2">
                      <RHFSingleMediaPickerField
                        control={form.control}
                        name={`credentials.${index}.imageUrl` as any}
                        label="Credential image"
                        placeholder="Pick credential image"
                        mediaType="image"
                        helperText="Stores one media id/path in category.staff_credentials.image_url."
                        modalTitle="Pick credential image"
                      />
                    </div>
                    <FormField control={form.control} name={`credentials.${index}.credential`} render={({ field }) => <FormItem><FormLabel>Credential</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name={`credentials.${index}.isVerified`} render={({ field }) => <FormItem className="flex items-center justify-between rounded-xl border p-3"><FormLabel>Verified</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} />
                  </ArrayItemShell>
                ))}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <SectionHeader icon={Award} title="Achievements" />
                <Button type="button" variant="outline" onClick={() => achievements.append({ icon: "", title: "", organization: "", displayOrder: achievements.fields.length })}><Plus className="mr-2 h-4 w-4" /> Add achievement</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {achievements.fields.map((field, index) => <ArrayItemShell key={field.id} onRemove={() => achievements.remove(index)}><FormField control={form.control} name={`achievements.${index}.icon`} render={({ field }) => <FormItem><FormLabel>Icon</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="award" /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name={`achievements.${index}.title`} render={({ field }) => <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name={`achievements.${index}.organization`} render={({ field }) => <FormItem><FormLabel>Organization</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name={`achievements.${index}.displayOrder`} render={({ field }) => <FormItem><FormLabel>Display order</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>} /></ArrayItemShell>)}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <SectionHeader icon={ImageIcon} title="Gallery and before/after media" description="Uses the central media manager instead of manual file URLs." />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => galleryItems.append({ title: emptyLocalized(), description: emptyLocalized(), url: "", mediaType: "image", displayOrder: galleryItems.fields.length, isPrimary: galleryItems.fields.length === 0 })}><Plus className="mr-2 h-4 w-4" /> Gallery item</Button>
                  <Button type="button" variant="outline" onClick={() => beforeAfterItems.append({ beforeImage: "", afterImage: "", procedure: "", months: undefined, displayOrder: beforeAfterItems.fields.length })}><Plus className="mr-2 h-4 w-4" /> Before/after</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <RHFMultiMediaPickerField control={form.control} name="galleryBulkMediaIds" label="Bulk add gallery media" placeholder="Pick files" mediaType="all" helperText="Stores selected ids as comma-separated text; they are converted into gallery rows on save." modalTitle="Pick gallery files" />
                {galleryItems.fields.map((field, index) => <ArrayItemShell key={field.id} onRemove={() => galleryItems.remove(index)}><div className="md:col-span-2"><RHFSingleMediaPickerField control={form.control} name={`galleryItems.${index}.url` as any} label="Media" placeholder="Pick media" mediaType="all" helperText="Stores one media id/path." modalTitle="Pick media" /></div><FormField control={form.control} name={`galleryItems.${index}.title`} render={({ field }) => <FormItem className="md:col-span-2"><LocalizedInput label="Title" value={field.value} onChange={field.onChange} /><FormMessage /></FormItem>} /><FormField control={form.control} name={`galleryItems.${index}.description`} render={({ field }) => <FormItem className="md:col-span-2"><LocalizedInput label="Description" value={field.value} onChange={field.onChange} rows={3} /><FormMessage /></FormItem>} /><RHFLazySearchableSelectField control={form.control} name={`galleryItems.${index}.mediaType` as any} label="Media type" resource="staffGalleryMediaTypes" locale={locale} placeholder="Search and select media type" disabled={isPending} /><FormField control={form.control} name={`galleryItems.${index}.displayOrder`} render={({ field }) => <FormItem><FormLabel>Display order</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name={`galleryItems.${index}.isPrimary`} render={({ field }) => <FormItem className="flex items-center justify-between rounded-xl border p-3"><FormLabel>Primary</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} /></ArrayItemShell>)}
                {beforeAfterItems.fields.map((field, index) => <ArrayItemShell key={field.id} onRemove={() => beforeAfterItems.remove(index)}><RHFSingleMediaPickerField control={form.control} name={`beforeAfterItems.${index}.beforeImage` as any} label="Before image" placeholder="Pick before image" mediaType="image" helperText="Stores one media id/path." modalTitle="Pick before image" /><RHFSingleMediaPickerField control={form.control} name={`beforeAfterItems.${index}.afterImage` as any} label="After image" placeholder="Pick after image" mediaType="image" helperText="Stores one media id/path." modalTitle="Pick after image" /><FormField control={form.control} name={`beforeAfterItems.${index}.procedure`} render={({ field }) => <FormItem><FormLabel>Procedure</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name={`beforeAfterItems.${index}.months`} render={({ field }) => <FormItem><FormLabel>Months</FormLabel><FormControl><Input type="number" min={0} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name={`beforeAfterItems.${index}.displayOrder`} render={({ field }) => <FormItem><FormLabel>Display order</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>} /></ArrayItemShell>)}
              </CardContent>
            </Card>

            <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-2xl border bg-white/95 p-4 shadow-xl backdrop-blur">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Sparkles className="h-4 w-4 text-[#eac074]" /> Full staff profile, relations, and media will be saved in one transaction.</div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => router.push("/admin/staff")} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending} className="bg-[#083f30] hover:bg-[#083f30]/90"><Save className="mr-2 h-4 w-4" />{isPending ? "Saving..." : isEdit ? "Update staff" : "Create staff"}</Button>
              </div>
            </div>
          </form>
        </Form>
      </ZodErrorProvider>
    </CardContent>
  );
}

export function StaffFormSkeleton() {
  return (
    <CardContent className="space-y-6 p-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index}>
          <CardHeader><Skeleton className="h-6 w-56" /><Skeleton className="h-4 w-80" /></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full md:col-span-2" /></CardContent>
        </Card>
      ))}
    </CardContent>
  );
}
