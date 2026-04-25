"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { hasLexicalContent, LexicalRenderer } from "@/components/editor/lexical-renderer";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import { createEmptyLocalizedContent, normalizeLocalizedContent } from "@/features/shared/utils/localization";
import useAction from "@/hooks/use-action";
import { Link } from "@/i18n/navigation";

import {
  deleteProviderAttributeAction,
  deleteProviderCertificationAction,
  deleteProviderCommentAction,
  deleteProviderGalleryItemAction,
  deleteProviderPolicyAction,
  deleteProviderRecommendationAction,
  deleteProviderServiceAction,
  deleteProviderStaffAction,
  saveProviderAttributeAction,
  saveProviderCertificationAction,
  saveProviderGalleryItemAction,
  saveProviderPolicyAction,
  saveProviderRecommendationAction,
  saveProviderServiceAction,
  saveProviderStaffAction,
  updateProviderCommentModerationAction,
  updateProviderRequestStatusAction,
} from "../../actions/admin";
import {
  AdminProviderLookupData,
  AdminServiceProviderDetails,
} from "../../db/admin-service-providers.queries";
import { RHFSingleMediaPickerField } from "../service-provider-data-entry/media-picker-adapter";
import { LazyAdminLookupSelect } from "./lazy-admin-lookup-select";

type Props = {
  provider: AdminServiceProviderDetails;
  lookups: AdminProviderLookupData;
  locale: string;
};

function text(value?: string | null) {
  return value && value.trim() ? value : "-";
}

function translationText(value?: Record<string, string> | null, fallback = "-") {
  if (!value || typeof value !== "object") return fallback;

  const preferredLocales = ["en-US", "en", "fa-IR", "fa"];
  for (const key of preferredLocales) {
    const exact = value[key]?.trim();
    if (exact) return exact;
  }

  const enRegionalKey = Object.keys(value).find((key) =>
    key.toLowerCase().replace("_", "-").startsWith("en-")
  );
  if (enRegionalKey && value[enRegionalKey]?.trim()) return value[enRegionalKey].trim();

  const firstNonEmpty = Object.values(value).find(
    (item) => typeof item === "string" && item.trim().length > 0
  );
  return firstNonEmpty?.trim() || fallback;
}

function dateText(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function RichTranslation({
  value,
  fallback = "No description.",
  className = "text-sm text-muted-foreground leading-relaxed",
}: {
  value?: Record<string, string> | null;
  fallback?: string;
  className?: string;
}) {
  const content = translationText(value, "");

  if (content && hasLexicalContent(content)) {
    return <LexicalRenderer content={content} className={className} />;
  }

  return <p className={className}>{content || fallback}</p>;
}

function MetricCard({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {hint ? <CardContent className="text-sm text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  );
}

function EmptyState({ title }: { title: string }) {
  return <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{title}</div>;
}

function ActionErrorToast(error: any) {
  toast.error(error?.detail || error?.title || "Action failed.");
}

export function ServiceProviderAdminDashboard({ provider, lookups, locale }: Props) {
  const tabs = [
    ["overview", "Overview"],
    ["services", "Services"],
    ["staff", "Staff"],
    ["media", "Media"],
    ["policies", "Policies"],
    ["attributes", "Attributes"],
    ["certifications", "Certifications"],
    ["reviews", "Reviews"],
    ["requests", "Requests"],
    ["bookings", "Bookings"],
    ["recommendations", "Recommendations"],
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl">{translationText(provider.name)}</CardTitle>
                <Badge variant={provider.isActive ? "default" : "secondary"}>{provider.isActive ? "Active" : "Inactive"}</Badge>
                {provider.accredited ? <Badge variant="outline">Accredited</Badge> : null}
                {provider.isSponsored ? <Badge>{provider.sponsoredTag || "Sponsored"}</Badge> : null}
              </div>
              <CardDescription>{provider.providerTypeName} · {provider.city}, {provider.country}</CardDescription>
            </div>
            <Button asChild>
              <Link href={`/admin/service-providers/${provider.id}/update`}>
                <Edit className="mr-2 h-4 w-4" /> Edit profile
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="overview" className="w-full">
            <div className="overflow-x-auto border-b px-4 py-3">
              <TabsList className="w-max">
                {tabs.map(([value, label]) => (
                  <TabsTrigger key={value} value={value}>{label}</TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="overview" className="m-0 p-6">
              <OverviewTab provider={provider} />
            </TabsContent>
            <TabsContent value="services" className="m-0 p-6">
              <ServicesManager provider={provider} lookups={lookups} locale={locale} />
            </TabsContent>
            <TabsContent value="staff" className="m-0 p-6">
              <StaffManager provider={provider} lookups={lookups} locale={locale} />
            </TabsContent>
            <TabsContent value="media" className="m-0 p-6">
              <GalleryManager provider={provider} />
            </TabsContent>
            <TabsContent value="policies" className="m-0 p-6">
              <PoliciesManager provider={provider} lookups={lookups} locale={locale} />
            </TabsContent>
            <TabsContent value="attributes" className="m-0 p-6">
              <AttributesManager provider={provider} lookups={lookups} locale={locale} />
            </TabsContent>
            <TabsContent value="certifications" className="m-0 p-6">
              <CertificationsManager provider={provider} />
            </TabsContent>
            <TabsContent value="reviews" className="m-0 p-6">
              <ReviewsManager provider={provider} />
            </TabsContent>
            <TabsContent value="requests" className="m-0 p-6">
              <RequestsManager provider={provider} lookups={lookups} locale={locale} />
            </TabsContent>
            <TabsContent value="bookings" className="m-0 p-6">
              <BookingsTab provider={provider} />
            </TabsContent>
            <TabsContent value="recommendations" className="m-0 p-6">
              <RecommendationsManager provider={provider} lookups={lookups} locale={locale} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewTab({ provider }: { provider: AdminServiceProviderDetails }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Services" value={provider.services.length} hint="Provider-service rows" />
        <MetricCard title="Staff" value={provider.staff.length} hint="Linked specialists/staff" />
        <MetricCard title="Rating" value={`${provider.rating.toFixed(2)} / 5`} hint={`${provider.reviewCount} public review counter`} />
        <MetricCard title="Bookings" value={provider.bookings.length} hint="Latest loaded bookings" />
      </div>
      <Card>
        <CardHeader><CardTitle>Description</CardTitle></CardHeader>
        <CardContent>
          <RichTranslation value={provider.description} fallback="No provider description." className="text-muted-foreground leading-relaxed" />
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Profile summary</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <Info label="Email" value={provider.email} />
            <Info label="Phone" value={`${provider.phoneNumberCountryCode} ${provider.phoneNumber}`} />
            <Info label="Address" value={[provider.city, provider.country, provider.zipCode].filter(Boolean).join(", ")} />
            <Info label="Timezone" value={provider.timezoneId} />
            <Info label="Established" value={text(provider.establishedYear?.toString())} />
            <Info label="Response time" value={text(provider.responseTime)} />
            <Info label="Success rate" value={text(provider.successRate)} />
            <Info label="Total patients" value={text(provider.totalPatients)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Discovery</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Info label="Languages" value={provider.languages.length ? provider.languages.join(", ") : "-"} />
            <Info label="Specialties" value={provider.specialties.length ? provider.specialties.join(", ") : "-"} />
            <Info label="Featured score" value={provider.featuredScore.toString()} />
            <Info label="Coordinates" value={provider.coordinates ? `${provider.coordinates.latitude}, ${provider.coordinates.longitude}` : "-"} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 break-words">{value}</div>
    </div>
  );
}

function CertificationsManager({ provider }: { provider: AdminServiceProviderDetails }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const save = useAction(saveProviderCertificationAction, { startTransition, onSuccess: () => { toast.success("Certification saved."); setName(""); }, onError: ActionErrorToast });
  const del = useAction(deleteProviderCertificationAction, { startTransition, onSuccess: () => toast.success("Certification deleted."), onError: ActionErrorToast });

  return (
    <RelationCard title="Certifications" description="Manages category.provider_certifications.">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Certification name" disabled={isPending} />
        <label className="flex items-center gap-2 rounded-md border px-3 text-sm"><Checkbox checked={isVerified} onCheckedChange={(v) => setIsVerified(Boolean(v))} /> Verified</label>
        <Button onClick={() => save.execute({ serviceProviderId: provider.id, name, isVerified })} disabled={isPending || !name.trim()}><Plus className="mr-2 h-4 w-4" /> Add</Button>
      </div>
      <div className="space-y-2">
        {provider.certifications.length ? provider.certifications.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border p-3">
            <div><div className="font-medium">{item.name}</div>{item.isVerified ? <Badge variant="outline">Verified</Badge> : null}</div>
            <Button variant="ghost" size="sm" onClick={() => del.execute({ serviceProviderId: provider.id, id: item.id })}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )) : <EmptyState title="No certifications yet." />}
      </div>
    </RelationCard>
  );
}

type ProviderGalleryDraftForm = {
  title: Record<string, string>;
  description: Record<string, string>;
  url: string;
  mediaType: string;
  displayOrder: number;
};

function GalleryManager({ provider }: { provider: AdminServiceProviderDetails }) {
  const [isPending, startTransition] = useTransition();
  const galleryForm = useForm<ProviderGalleryDraftForm>({
    defaultValues: {
      title: createEmptyLocalizedContent(),
      description: createEmptyLocalizedContent(),
      url: "",
      mediaType: "image",
      displayOrder: 0,
    },
  });

  const save = useAction(saveProviderGalleryItemAction, { startTransition, onSuccess: () => { toast.success("Media item saved."); galleryForm.reset({ title: createEmptyLocalizedContent(), description: createEmptyLocalizedContent(), url: "", mediaType: "image", displayOrder: 0 }); }, onError: ActionErrorToast });
  const del = useAction(deleteProviderGalleryItemAction, { startTransition, onSuccess: () => toast.success("Media item deleted."), onError: ActionErrorToast });

  const onAddGalleryItem = galleryForm.handleSubmit((values) => {
    save.execute({
      serviceProviderId: provider.id,
      title: normalizeLocalizedContent(values.title),
      description: normalizeLocalizedContent(values.description),
      url: values.url,
      mediaType: values.mediaType || "image",
      displayOrder: Number(values.displayOrder || 0),
    });
  });

  return (
    <RelationCard title="Media gallery" description="Manages category.provider_gallery_items. The media field uses the central media picker and stores one media id or URL.">
      <Form {...galleryForm}>
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_180px_140px_auto]">
          <FormField
            control={galleryForm.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <LocalizedInput label="Title" value={field.value} onChange={field.onChange} maxLength={250} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={galleryForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <LocalizedInput label="Description" value={field.value} onChange={field.onChange} richText rows={4} maxLength={2000} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <RHFSingleMediaPickerField
            control={galleryForm.control}
            name="url"
            label="Media"
            placeholder="Pick media"
            mediaType="all"
            helperText="Stores one media id in provider_gallery_items.url."
            modalTitle="Pick gallery media"
          />
          <div className="grid gap-3">
            <FormField
              control={galleryForm.control}
              name="mediaType"
              render={({ field }) => (
                <FormItem>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Media type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="file">File</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={galleryForm.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormControl><Input type="number" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} placeholder="Order" /></FormControl>
                </FormItem>
              )}
            />
          </div>
          <Button type="button" onClick={() => onAddGalleryItem()} disabled={isPending || !galleryForm.watch("url")} className="self-start">
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
      </Form>
      <div className="space-y-2">
        {provider.galleryItems.length ? provider.galleryItems.map((item) => (
          <div key={item.id} className="grid items-start gap-3 rounded-xl border p-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <div>
              <div className="font-medium">{translationText(item.title, "Untitled")}</div>
              <RichTranslation value={item.description} fallback="No media description." />
              <div className="mt-1 text-sm text-muted-foreground">{item.mediaType} · order {item.displayOrder}</div>
            </div>
            <code className="truncate rounded bg-muted px-2 py-1 text-xs">{item.url}</code>
            <Badge variant="outline">{item.mediaType}</Badge>
            <Button variant="ghost" size="sm" onClick={() => del.execute({ serviceProviderId: provider.id, id: item.id })}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )) : <EmptyState title="No gallery items yet." />}
      </div>
    </RelationCard>
  );
}

type ProviderPolicyDraftForm = {
  policyTypeId: string;
  description: Record<string, string>;
};

function PoliciesManager({ provider, lookups, locale }: Props) {
  const [isPending, startTransition] = useTransition();
  const policyForm = useForm<ProviderPolicyDraftForm>({
    defaultValues: {
      policyTypeId: "",
      description: createEmptyLocalizedContent(),
    },
  });
  const save = useAction(saveProviderPolicyAction, { startTransition, onSuccess: () => { toast.success("Policy saved."); policyForm.reset({ policyTypeId: "", description: createEmptyLocalizedContent() }); }, onError: ActionErrorToast });
  const del = useAction(deleteProviderPolicyAction, { startTransition, onSuccess: () => toast.success("Policy deleted."), onError: ActionErrorToast });

  const onAddPolicy = policyForm.handleSubmit((values) => {
    const selectedPolicyType = lookups.policyTypes.find((item) => String(item.id) === values.policyTypeId);

    save.execute({
      serviceProviderId: provider.id,
      policyTypeId: values.policyTypeId,
      type: { "en-US": selectedPolicyType?.label || "Policy" },
      description: normalizeLocalizedContent(values.description),
    });
  });

  return (
    <RelationCard title="Policies" description="Cancellation, refund, admission, age, document, and house rules.">
      <Form {...policyForm}>
        <div className="grid gap-4 md:grid-cols-[320px_1fr_auto]">
          <FormField
            control={policyForm.control}
            name="policyTypeId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <LazyAdminLookupSelect
                    lookupType="policyTypes"
                    locale={locale}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select policy type"
                    initialOptions={lookups.policyTypes}
                    disabled={isPending}
                    contentClassName="w-[420px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={policyForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <LocalizedInput label="Description" value={field.value} onChange={field.onChange} richText rows={4} maxLength={2000} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="button" onClick={() => onAddPolicy()} disabled={isPending || !policyForm.watch("policyTypeId")} className="self-start">
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
      </Form>
      <div className="space-y-2">
        {provider.policies.length ? provider.policies.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border p-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium">{translationText(item.type)}</div>
                {item.policyTypeCode ? <Badge variant="outline">{item.policyTypeCode}</Badge> : null}
              </div>
              <RichTranslation value={item.description} fallback="No policy description." />
            </div>
            <Button variant="ghost" size="sm" onClick={() => del.execute({ serviceProviderId: provider.id, id: item.id })}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )) : <EmptyState title="No policies yet." />}
      </div>
    </RelationCard>
  );
}

function AttributesManager({ provider, lookups, locale }: Props) {
  const [isPending, startTransition] = useTransition();
  const [attributeDefinitionId, setAttributeDefinitionId] = useState("");
  const [value, setValue] = useState("");
  const save = useAction(saveProviderAttributeAction, { startTransition, onSuccess: () => { toast.success("Attribute saved."); setValue(""); }, onError: ActionErrorToast });
  const del = useAction(deleteProviderAttributeAction, { startTransition, onSuccess: () => toast.success("Attribute deleted."), onError: ActionErrorToast });

  return (
    <RelationCard title="Provider attributes" description="Dynamic attributes configured per provider type.">
      <div className="grid gap-3 md:grid-cols-[320px_1fr_auto]">
        <LazyAdminLookupSelect
          lookupType="attributeDefinitions"
          locale={locale}
          value={attributeDefinitionId}
          onValueChange={setAttributeDefinitionId}
          placeholder="Select attribute"
          initialOptions={lookups.attributeDefinitions.filter((item) => item.providerTypeId === provider.providerTypeId)}
          queryParams={{ providerTypeId: provider.providerTypeId }}
          disabled={isPending}
          contentClassName="w-[420px]"
        />
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" disabled={isPending} />
        <Button onClick={() => save.execute({ serviceProviderId: provider.id, attributeDefinitionId, value: { "en-US": value } })} disabled={isPending || !attributeDefinitionId || !value.trim()}><Plus className="mr-2 h-4 w-4" /> Save</Button>
      </div>
      <div className="space-y-2">
        {provider.attributes.length ? provider.attributes.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border p-3">
            <div><div className="font-medium">{item.attributeName}</div><p className="text-sm text-muted-foreground">{translationText(item.value)}</p></div>
            <Button variant="ghost" size="sm" onClick={() => del.execute({ serviceProviderId: provider.id, id: item.id })}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )) : <EmptyState title="No attributes yet." />}
      </div>
    </RelationCard>
  );
}

function ServicesManager({ provider, lookups, locale }: Props) {
  const [isPending, startTransition] = useTransition();
  const [serviceDefinitionId, setServiceDefinitionId] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [duration, setDuration] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const save = useAction(saveProviderServiceAction, { startTransition, onSuccess: () => { toast.success("Service saved."); setName(""); }, onError: ActionErrorToast });
  const del = useAction(deleteProviderServiceAction, { startTransition, onSuccess: () => toast.success("Service deleted."), onError: ActionErrorToast });

  return (
    <RelationCard title="Provider services" description="Manages category.provider_services, provider_service_addons, and service image references.">
      <div className="grid gap-3 xl:grid-cols-[260px_1fr_100px_100px_100px_1fr_auto]">
        <LazyAdminLookupSelect
          lookupType="serviceDefinitions"
          locale={locale}
          value={serviceDefinitionId}
          onValueChange={setServiceDefinitionId}
          placeholder="Definition"
          initialOptions={lookups.serviceDefinitions}
          excludeIds={provider.services.map((item) => item.serviceDefinitionId)}
          disabled={isPending}
          contentClassName="w-[460px]"
        />
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" disabled={isPending} />
        <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" disabled={isPending} />
        <Input value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="Price" disabled={isPending} />
        <Input value={duration} onChange={(e) => setDuration(e.target.value)} type="number" placeholder="Minutes" disabled={isPending} />
        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Media id / image URL" disabled={isPending} />
        <Button onClick={() => save.execute({ serviceProviderId: provider.id, serviceDefinitionId, displayName: { "en-US": name }, description: {}, isActive, currency, value: Number(price), durationMinutes: Number(duration), imageUrl, addonIds: [], slotIntervalMinutes: 15 })} disabled={isPending || !serviceDefinitionId || !name.trim()}><Plus className="mr-2 h-4 w-4" /> Add</Button>
      </div>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(Boolean(v))} /> New service active</label>
      <div className="space-y-2">
        {provider.services.length ? provider.services.map((item) => (
          <div key={item.id} className="grid items-center gap-3 rounded-xl border p-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
            <div><div className="font-medium">{translationText(item.displayName, item.serviceDefinitionName)}</div><div className="text-sm text-muted-foreground">{item.serviceDefinitionName} · {item.durationMinutes} min · {item.currency} {item.value}</div></div>
            {item.isPopular ? <Badge>Popular</Badge> : null}
            <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Active" : "Inactive"}</Badge>
            <Badge variant="outline">{item.rating} ★</Badge>
            <Button variant="ghost" size="sm" onClick={() => del.execute({ serviceProviderId: provider.id, id: item.id })}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )) : <EmptyState title="No provider services yet." />}
      </div>
    </RelationCard>
  );
}

function StaffManager({ provider, lookups, locale }: Props) {
  const [isPending, startTransition] = useTransition();
  const [staffId, setStaffId] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const save = useAction(saveProviderStaffAction, { startTransition, onSuccess: () => { toast.success("Staff linked."); setNotes(""); }, onError: ActionErrorToast });
  const del = useAction(deleteProviderStaffAction, { startTransition, onSuccess: () => toast.success("Staff unlinked."), onError: ActionErrorToast });

  return (
    <RelationCard title="Provider staff" description="Links specialists/staff to this provider.">
      <div className="grid gap-3 md:grid-cols-[320px_1fr_auto]">
        <LazyAdminLookupSelect
          lookupType="staff"
          locale={locale}
          value={staffId}
          onValueChange={setStaffId}
          placeholder="Select staff"
          initialOptions={lookups.staff}
          excludeIds={provider.staff.map((item) => item.staffId)}
          disabled={isPending}
          contentClassName="w-[420px]"
        />
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" disabled={isPending} />
        <Button onClick={() => save.execute({ serviceProviderId: provider.id, staffId, notes: { "en-US": notes }, isActive })} disabled={isPending || !staffId}><Plus className="mr-2 h-4 w-4" /> Link</Button>
      </div>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(Boolean(v))} /> New link active</label>
      <div className="space-y-2">
        {provider.staff.length ? provider.staff.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border p-3">
            <div><div className="font-medium">{item.staffName}</div><div className="text-sm text-muted-foreground">{text(item.staffTitle)} · {item.isActive ? "Active" : "Inactive"}</div></div>
            <Button variant="ghost" size="sm" onClick={() => del.execute({ serviceProviderId: provider.id, id: item.id })}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )) : <EmptyState title="No staff linked yet." />}
      </div>
    </RelationCard>
  );
}

function ReviewsManager({ provider }: { provider: AdminServiceProviderDetails }) {
  const [isPending, startTransition] = useTransition();
  const update = useAction(updateProviderCommentModerationAction, { startTransition, onSuccess: () => toast.success("Review updated."), onError: ActionErrorToast });
  const del = useAction(deleteProviderCommentAction, { startTransition, onSuccess: () => toast.success("Review deleted."), onError: ActionErrorToast });
  return (
    <RelationCard title="Reviews and comments" description="Moderate category.service_provider_comments and review images.">
      <div className="space-y-2">
        {provider.comments.length ? provider.comments.map((item) => (
          <div key={item.id} className="rounded-xl border p-3">
            <div className="flex items-start justify-between gap-3">
              <div><div className="font-medium">{item.customerName} · {item.rating ?? "-"} ★</div><p className="text-sm text-muted-foreground">{item.commentText}</p><div className="mt-2 flex flex-wrap gap-2"><Badge variant={item.isPublic ? "default" : "secondary"}>{item.isPublic ? "Public" : "Hidden"}</Badge>{item.isVerified ? <Badge variant="outline">Verified</Badge> : null}<Badge variant="outline">Helpful {item.helpfulCount}</Badge></div></div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => update.execute({ serviceProviderId: provider.id, id: item.id, isPublic: !item.isPublic, isVerified: item.isVerified, helpfulCount: item.helpfulCount })} disabled={isPending}>{item.isPublic ? "Hide" : "Publish"}</Button>
                <Button variant="outline" size="sm" onClick={() => update.execute({ serviceProviderId: provider.id, id: item.id, isPublic: item.isPublic, isVerified: !item.isVerified, helpfulCount: item.helpfulCount })} disabled={isPending}>{item.isVerified ? "Unverify" : "Verify"}</Button>
                <Button variant="ghost" size="sm" onClick={() => del.execute({ serviceProviderId: provider.id, id: item.id })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        )) : <EmptyState title="No reviews yet." />}
      </div>
    </RelationCard>
  );
}

function RequestsManager({ provider, lookups, locale }: Props) {
  const [isPending, startTransition] = useTransition();
  const update = useAction(updateProviderRequestStatusAction, { startTransition, onSuccess: () => toast.success("Request status updated."), onError: ActionErrorToast });
  return (
    <RelationCard title="Provider requests" description="Admin status workflow for service_provider_requests.">
      <div className="space-y-2">
        {provider.requests.length ? provider.requests.map((item) => (
          <div key={item.id} className="grid gap-3 rounded-xl border p-3 lg:grid-cols-[1fr_220px]">
            <div><div className="font-medium">{item.customerFullName} · {item.customerEmail}</div><p className="text-sm text-muted-foreground">{item.message}</p><div className="mt-2 text-xs text-muted-foreground">Created {dateText(item.createDate)}</div></div>
            <LazyAdminLookupSelect
              lookupType="requestStatuses"
              locale={locale}
              value={String(item.requestStatusId)}
              onValueChange={(value) => value && update.execute({ serviceProviderId: provider.id, id: item.id, requestStatusId: Number(value) })}
              placeholder="Request status"
              initialOptions={lookups.requestStatuses}
              disabled={isPending}
              clearable={false}
            />
          </div>
        )) : <EmptyState title="No provider requests." />}
      </div>
    </RelationCard>
  );
}

function BookingsTab({ provider }: { provider: AdminServiceProviderDetails }) {
  return (
    <RelationCard title="Bookings and drafts" description="Read-only operational snapshot from booking.bookings and booking.booking_drafts.">
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 font-medium">Bookings</h3>
          <div className="space-y-2">
            {provider.bookings.length ? provider.bookings.map((item) => (
              <div key={item.id} className="grid gap-2 rounded-xl border p-3 text-sm lg:grid-cols-[1fr_auto_auto_auto]">
                <div><div className="font-medium">{item.serviceName}</div><div className="text-muted-foreground">{item.specialistName} · {item.selectedDate} {item.selectedTimeFrom}-{item.selectedTimeTo}</div></div>
                <Badge>{item.bookingStatus}</Badge>
                <Badge variant="outline">{text(item.paymentStatus)}</Badge>
                <div>{item.currencyCode || ""} {item.totalAmount ?? 0}</div>
              </div>
            )) : <EmptyState title="No bookings loaded." />}
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-medium">Drafts</h3>
          <div className="space-y-2">
            {provider.bookingDrafts.length ? provider.bookingDrafts.map((item) => (
              <div key={item.id} className="grid gap-2 rounded-xl border p-3 text-sm lg:grid-cols-[1fr_auto_auto]">
                <div><div className="font-medium">{item.serviceName || "No service selected"}</div><div className="text-muted-foreground">Step {item.currentStep} · updated {dateText(item.updatedAt)}</div></div>
                <Badge variant="outline">{item.status}</Badge>
                <div>{item.currency} {item.totalAmount}</div>
              </div>
            )) : <EmptyState title="No drafts loaded." />}
          </div>
        </div>
      </div>
    </RelationCard>
  );
}

function RecommendationsManager({ provider, lookups, locale }: Props) {
  const [isPending, startTransition] = useTransition();
  const [targetProviderId, setTargetProviderId] = useState("");
  const [type, setType] = useState("similar");
  const save = useAction(saveProviderRecommendationAction, { startTransition, onSuccess: () => toast.success("Recommendation saved."), onError: ActionErrorToast });
  const del = useAction(deleteProviderRecommendationAction, { startTransition, onSuccess: () => toast.success("Recommendation deleted."), onError: ActionErrorToast });
  return (
    <RelationCard title="Recommendations" description="Controls local/international/similar provider recommendations.">
      <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <LazyAdminLookupSelect
          lookupType="providers"
          locale={locale}
          value={targetProviderId}
          onValueChange={setTargetProviderId}
          placeholder="Target provider"
          initialOptions={lookups.providers.filter((item) => String(item.id) !== provider.id)}
          queryParams={{ excludeProviderId: provider.id }}
          disabled={isPending}
          contentClassName="w-[460px]"
        />
        <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="similar/local/international" disabled={isPending} />
        <Button onClick={() => save.execute({ serviceProviderId: provider.id, targetProviderId, type })} disabled={isPending || !targetProviderId || !type.trim()}><Plus className="mr-2 h-4 w-4" /> Add</Button>
      </div>
      <div className="space-y-2">
        {provider.recommendations.length ? provider.recommendations.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border p-3">
            <div><div className="font-medium">{item.targetProviderName}</div><div className="text-sm text-muted-foreground">{item.type}</div></div>
            <Button variant="ghost" size="sm" onClick={() => del.execute({ serviceProviderId: provider.id, id: item.id })}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )) : <EmptyState title="No recommendations yet." />}
      </div>
    </RelationCard>
  );
}

function RelationCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
