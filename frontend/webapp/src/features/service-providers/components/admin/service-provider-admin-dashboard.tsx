"use client";


import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { OneToManyManager } from "@/components/admin/relations/one-to-many-manager";
import type { ChildCollectionPanel } from "@/lib/admin/child-relations";
import { getServiceBeforeAfterPanelAction } from "@/features/service-providers/admin/before-after-actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  hasLexicalContent,
  LexicalRenderer,
} from "@/components/editor/lexical-renderer";
import { SUPPORTED_LOCALE_HEADERS } from "@/config/locales";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import { createEmptyLocalizedContent } from "@/features/shared/utils/localization";
import SingleMediaPickerInput from "@/features/media-picker-addon/components/SingleMediaPickerInput";
import { ProviderGalleryPickerButton } from "./provider-image-gallery";
import useAction from "@/hooks/use-action";
import { Link, useRouter } from "@/i18n/navigation";

import {
  deleteProviderAttributeAction,
  deleteProviderCertificationAction,
  deleteProviderCommentAction,
  deleteProviderCommentReplyAction,
  deleteProviderGalleryItemAction,
  deleteProviderPolicyAction,
  deleteProviderRecommendationAction,
  deleteProviderServiceAction,
  deleteProviderStaffAction,
  saveProviderAttributeAction,
  saveProviderCertificationAction,
  saveProviderCommentAction,
  saveProviderCommentReplyAction,
  saveProviderGalleryItemAction,
  saveProviderPolicyAction,
  saveProviderRecommendationAction,
  saveProviderServiceAction,
  saveProviderStaffAction,
  updateProviderCommentModerationAction,
  updateProviderCommentReplyModerationAction,
  updateProviderRequestStatusAction,
} from "../../actions/admin";
import {
  AdminProviderLookupData,
  AdminServiceProviderDetails,
} from "../../db/admin-service-providers.queries";
import {
  normalizeLocalizedContentForDatabase,
  normalizeMediaPickerValue,
  toLocalizedInputValue,
  type AdminLocalizedInputValue,
} from "../../lib/admin-form-normalizers";
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

function hasLocalizedMeaningfulContent(value: Record<string, string>) {
  return Object.values(value).some((item) => {
    const raw = String(item || "").trim();
    if (!raw) return false;

    try {
      const parsed = JSON.parse(raw) as any;
      const root = parsed?.root;
      if (!root || !Array.isArray(root.children)) return raw.length > 0;

      const walk = (nodes: any[]): boolean =>
        nodes.some((node) => {
          if (typeof node?.text === "string" && node.text.trim()) return true;
          if (Array.isArray(node?.children)) return walk(node.children);
          return false;
        });

      return walk(root.children);
    } catch {
      return raw.length > 0;
    }
  });
}

function translationText(
  value?: Record<string, string> | null,
  fallback = "-",
) {
  if (!value || typeof value !== "object") return fallback;

  const preferredLocales = ["en-US", "en", "fa-IR", "fa"];
  for (const key of preferredLocales) {
    const exact = value[key]?.trim();
    if (exact) return exact;
  }

  const enRegionalKey = Object.keys(value).find((key) =>
    key.toLowerCase().replace("_", "-").startsWith("en-"),
  );
  if (enRegionalKey && value[enRegionalKey]?.trim())
    return value[enRegionalKey].trim();

  const firstNonEmpty = Object.values(value).find(
    (item) => typeof item === "string" && item.trim().length > 0,
  );
  return firstNonEmpty?.trim() || fallback;
}

function dateText(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
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

type LocalizedInputBridgeProps = {
  label: string;
  value: unknown;
  onChange: (value: AdminLocalizedInputValue) => void;
  locale: string;
  required?: boolean;
  maxLength?: number;
  description?: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
  richText?: boolean;
};

function LocalizedInputBridge({
  value,
  onChange,
  locale,
  ...props
}: LocalizedInputBridgeProps) {
  const normalizedValue = useMemo(
    () => toLocalizedInputValue(value, locale, SUPPORTED_LOCALE_HEADERS),
    [value, locale],
  );

  return (
    <LocalizedInput
      {...props}
      value={normalizedValue}
      onChange={(nextValue) =>
        onChange(
          toLocalizedInputValue(nextValue, locale, SUPPORTED_LOCALE_HEADERS),
        )
      }
      supportedLocales={SUPPORTED_LOCALE_HEADERS}
    />
  );
}

function MetricCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent className="text-sm text-muted-foreground">
          {hint}
        </CardContent>
      ) : null}
    </Card>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
      {title}
    </div>
  );
}

function formatMoney(
  value: number | string | null | undefined,
  currency?: string | null,
  locale = "fa-IR",
) {
  const numericValue = Number(value || 0);
  const formatter = new Intl.NumberFormat(locale || "en-US", {
    minimumFractionDigits: numericValue % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${currency || ""} ${formatter.format(Number.isFinite(numericValue) ? numericValue : 0)}`.trim();
}

function normalizeLocalizedDigits(value: string) {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persianDigits.indexOf(digit);
    if (persianIndex >= 0) return String(persianIndex);

    const arabicIndex = arabicDigits.indexOf(digit);
    return arabicIndex >= 0 ? String(arabicIndex) : digit;
  });
}

function isGroupedThousands(value: string, separator: "," | ".") {
  const unsigned = value.replace(/^-/, "");
  const parts = unsigned.split(separator);

  if (parts.length < 2 || parts[0].length < 1 || parts[0].length > 3) {
    return false;
  }

  return parts.slice(1).every((part) => /^\d{3}$/.test(part));
}

function normalizeSingleSeparatorNumber(value: string, separator: "," | ".") {
  if (isGroupedThousands(value, separator)) {
    return value.replaceAll(separator, "");
  }

  const lastSeparatorIndex = value.lastIndexOf(separator);
  const integerPart = value.slice(0, lastSeparatorIndex).replace(/[.,]/g, "");
  const decimalPart = value.slice(lastSeparatorIndex + 1).replace(/[.,]/g, "");

  // Price fields are stored as numeric(18,2). A lone separator followed by
  // three digits is therefore almost always a thousands separator produced by
  // Intl.NumberFormat: 1,000 / 1.000 => 1000, not 1.
  if (decimalPart.length > 2) {
    return `${integerPart}${decimalPart}`;
  }

  return `${integerPart}.${decimalPart}`;
}

function parseFormattedNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const raw = normalizeLocalizedDigits(String(value || "").trim())
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
  if (!raw) return 0;

  const sanitized = raw.replace(/[^0-9.,-]/g, "");
  if (!sanitized || sanitized === "-" || sanitized === "." || sanitized === ",") {
    return 0;
  }

  const commaCount = (sanitized.match(/,/g) || []).length;
  const dotCount = (sanitized.match(/\./g) || []).length;
  const lastComma = sanitized.lastIndexOf(",");
  const lastDot = sanitized.lastIndexOf(".");

  let normalized = sanitized;

  if (commaCount > 0 && dotCount > 0) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const decimalIndex = normalized.lastIndexOf(decimalSeparator);
    const integerPart = normalized.slice(0, decimalIndex).replace(/[.,]/g, "");
    const decimalPart = normalized.slice(decimalIndex + 1).replace(/[.,]/g, "");
    normalized = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  } else if (commaCount > 0) {
    normalized = normalizeSingleSeparatorNumber(normalized, ",");
  } else if (dotCount > 0) {
    normalized = normalizeSingleSeparatorNumber(normalized, ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumberInput(
  value: string | number | null | undefined,
  locale = "fa-IR",
) {
  const parsed = parseFormattedNumber(value);
  return new Intl.NumberFormat(locale || "en-US", {
    maximumFractionDigits: 2,
  }).format(parsed);
}

function ActionErrorToast(error: any) {
  toast.error(error?.detail || error?.title || "Action failed.");
}

export function ServiceProviderAdminDashboard({
  provider,
  lookups,
  locale,
}: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const tabs = [
    ["overview", "Overview"],
    ["services", "Services"],
    ["before-after", "Before/After"],
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
                <CardTitle className="text-2xl">
                  {translationText(provider.name)}
                </CardTitle>
                <Badge variant={provider.isActive ? "default" : "secondary"}>
                  {provider.isActive ? "Active" : "Inactive"}
                </Badge>
                {provider.accredited ? (
                  <Badge variant="outline">{tAdmin("accredited")}</Badge>
                ) : null}
                {provider.isSponsored ? (
                  <Badge>{provider.sponsoredTag || "Sponsored"}</Badge>
                ) : null}
              </div>
              <CardDescription>
                {provider.providerTypeName} · {provider.city},{" "}
                {provider.country}
              </CardDescription>
            </div>
            <Button asChild>
              <Link href={`/admin/service-providers/${provider.id}/update`}>
                <Edit className="me-2 h-4 w-4" /> Edit profile
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="overview" className="w-full">
            <div className="overflow-x-auto border-b px-4 py-3">
              <TabsList className="w-max">
                {tabs.map(([value, label]) => (
                  <TabsTrigger key={value} value={value}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="overview" className="m-0 p-6">
              <OverviewTab provider={provider} />
            </TabsContent>
            <TabsContent value="services" className="m-0 p-6">
              <ServicesManager
                provider={provider}
                lookups={lookups}
                locale={locale}
              />
            </TabsContent>
            <TabsContent value="before-after" className="m-0 p-6">
              <ServiceBeforeAfterTab provider={provider} locale={locale} />
            </TabsContent>
            <TabsContent value="staff" className="m-0 p-6">
              <StaffManager
                provider={provider}
                lookups={lookups}
                locale={locale}
              />
            </TabsContent>
            <TabsContent value="media" className="m-0 p-6">
              <GalleryManager provider={provider} locale={locale} />
            </TabsContent>
            <TabsContent value="policies" className="m-0 p-6">
              <PoliciesManager
                provider={provider}
                lookups={lookups}
                locale={locale}
              />
            </TabsContent>
            <TabsContent value="attributes" className="m-0 p-6">
              <AttributesManager
                provider={provider}
                lookups={lookups}
                locale={locale}
              />
            </TabsContent>
            <TabsContent value="certifications" className="m-0 p-6">
              <CertificationsManager provider={provider} />
            </TabsContent>
            <TabsContent value="reviews" className="m-0 p-6">
              <ReviewsManager provider={provider} />
            </TabsContent>
            <TabsContent value="requests" className="m-0 p-6">
              <RequestsManager
                provider={provider}
                lookups={lookups}
                locale={locale}
              />
            </TabsContent>
            <TabsContent value="bookings" className="m-0 p-6">
              <BookingsTab provider={provider} />
            </TabsContent>
            <TabsContent value="recommendations" className="m-0 p-6">
              <RecommendationsManager
                provider={provider}
                lookups={lookups}
                locale={locale}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function ServiceBeforeAfterTab({
  provider,
  locale,
}: {
  provider: AdminServiceProviderDetails;
  locale: string;
}) {
  const services = provider.services;
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [panel, setPanel] = useState<ChildCollectionPanel | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!serviceId) {
      setPanel(null);
      return;
    }
    let active = true;
    setLoading(true);
    getServiceBeforeAfterPanelAction(serviceId, locale)
      .then((res) => {
        if (active) setPanel(res.ok ? res.panel : null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [serviceId, locale]);

  if (!services.length) {
    return (
      <p className="text-sm text-muted-foreground">
        This provider has no services yet. Add a service in the Services tab first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-w-md">
        <label className="mb-2 block text-sm font-medium">Service</label>
        <Select value={serviceId} onValueChange={setServiceId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {translationText(service.displayName, service.serviceDefinitionName) || service.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
          Manage before/after photos for the selected service.
        </p>
      </div>

      {loading ? (
        <div className="h-40 w-full animate-pulse rounded-3xl border border-zinc-200 bg-muted/40 dark:border-zinc-800" />
      ) : panel ? (
        <OneToManyManager
          key={serviceId}
          parentSchema="category"
          parentTable="provider_services"
          parentRecordId={serviceId}
          locale={locale}
          panels={[panel]}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load before/after for this service.
        </p>
      )}
    </div>
  );
}

function OverviewTab({ provider }: { provider: AdminServiceProviderDetails }) {
  const tAdmin = useTranslations("AdminGenerated");
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={tAdmin("services")}
          value={provider.services.length}
          hint="Provider-service rows"
        />
        <MetricCard
          title={tAdmin("staff")}
          value={provider.staff.length}
          hint="Linked specialists/staff"
        />
        <MetricCard
          title={tAdmin("rating")}
          value={`${provider.rating.toFixed(2)} / 5`}
          hint={`${provider.reviewCount} public review counter`}
        />
        <MetricCard
          title={tAdmin("bookings")}
          value={provider.bookings.length}
          hint="Latest loaded bookings"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{tAdmin("description")}</CardTitle>
        </CardHeader>
        <CardContent>
          <RichTranslation
            value={provider.description}
            fallback="No provider description."
            className="text-muted-foreground leading-relaxed"
          />
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tAdmin("profileSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <Info label={tAdmin("email")} value={provider.email} />
            <Info
              label={tAdmin("phone")}
              value={`${provider.phoneNumberCountryCode} ${provider.phoneNumber}`}
            />
            <Info
              label={tAdmin("address")}
              value={[provider.city, provider.country, provider.zipCode]
                .filter(Boolean)
                .join(", ")}
            />
            <Info label={tAdmin("timezone")} value={provider.timezoneId} />
            <Info
              label={tAdmin("established")}
              value={text(provider.establishedYear?.toString())}
            />
            <Info label={tAdmin("responseTime")} value={text(provider.responseTime)} />
            <Info label={tAdmin("successRate")} value={text(provider.successRate)} />
            <Info label={tAdmin("totalPatients")} value={text(provider.totalPatients)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{tAdmin("discovery")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Info
              label={tAdmin("languages")}
              value={
                provider.languages.length ? provider.languages.join(", ") : "-"
              }
            />
            <Info
              label={tAdmin("specialties")}
              value={
                provider.specialties.length
                  ? provider.specialties.join(", ")
                  : "-"
              }
            />
            <Info
              label={tAdmin("featuredScore")}
              value={provider.featuredScore.toString()}
            />
            <Info
              label={tAdmin("coordinates")}
              value={
                provider.coordinates
                  ? `${provider.coordinates.latitude}, ${provider.coordinates.longitude}`
                  : "-"
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 break-words">{value}</div>
    </div>
  );
}

function CertificationsManager({
  provider,
}: {
  provider: AdminServiceProviderDetails;
}) {
  const tAdmin = useTranslations("AdminGenerated");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [secondaryImageUrl, setSecondaryImageUrl] = useState("");
  const save = useAction(saveProviderCertificationAction, {
    startTransition,
    onSuccess: () => {
      toast.success(tAdmin("certificationSaved"));
      setName("");
      setIsVerified(false);
      setImageUrl("");
      setSecondaryImageUrl("");
      router.refresh();
    },
    onError: ActionErrorToast,
  });
  const del = useAction(deleteProviderCertificationAction, {
    startTransition,
    onSuccess: () => {
      toast.success(tAdmin("certificationDeleted"));
      router.refresh();
    },
    onError: ActionErrorToast,
  });

  return (
    <RelationCard
      title={tAdmin("certifications")}
      description="Manages category.provider_certifications."
    >
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={tAdmin("certificationName")}
          disabled={isPending}
        />
        <label className="flex items-center gap-2 rounded-md border px-3 text-sm">
          <Checkbox
            checked={isVerified}
            onCheckedChange={(v) => setIsVerified(Boolean(v))}
          />{" "}
          Verified
        </label>
        <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
          <SingleMediaPickerInput
            name="provider-certification-image"
            label="Certificate image"
            placeholder="Pick certificate image"
            mediaType="image"
            value={imageUrl}
            onValueChange={setImageUrl}
            disabled={isPending}
            helperText="Optional. Stores the resolved media URL in provider_certifications.image_url."
            modalTitle="Pick certificate image"
          />
          <SingleMediaPickerInput
            name="provider-certification-secondary-image"
            label="Second image"
            placeholder="Pick second image"
            mediaType="image"
            value={secondaryImageUrl}
            onValueChange={setSecondaryImageUrl}
            disabled={isPending}
            helperText="Optional. Stores the resolved media URL in provider_certifications.secondary_image_url."
            modalTitle="Pick second certificate image"
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button
            onClick={() =>
              save.execute({
                serviceProviderId: provider.id,
                name,
                isVerified,
                imageUrl,
                secondaryImageUrl,
              })
            }
            disabled={isPending || !name.trim()}
          >
            <Plus className="me-2 h-4 w-4" /> Add
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {provider.certifications.length ? (
          provider.certifications.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border p-3"
            >
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.isVerified ? (
                    <Badge variant="outline">{tAdmin("verified")}</Badge>
                  ) : null}
                  {item.imageUrl ? <Badge variant="secondary">Image 1</Badge> : null}
                  {item.secondaryImageUrl ? <Badge variant="secondary">Image 2</Badge> : null}
                </div>
                {(item.imageUrl || item.secondaryImageUrl) ? (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {[item.imageUrl, item.secondaryImageUrl]
                      .filter((url) => {
                        const src = String(url || "").trim();
                        return src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/");
                      })
                      .map((url) => (
                        <img
                          key={String(url)}
                          src={String(url)}
                          alt={item.name}
                          className="h-20 w-28 rounded-lg border object-cover"
                        />
                      ))}
                  </div>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  del.execute({ serviceProviderId: provider.id, id: item.id })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <EmptyState title={tAdmin("noCertificationsYet")} />
        )}
      </div>
    </RelationCard>
  );
}

type ProviderGalleryDraftForm = {
  title: Record<string, unknown>;
  description: Record<string, unknown>;
  url: unknown;
  mediaType: string;
  displayOrder: number;
};

function GalleryManager({
  provider,
  locale,
}: {
  provider: AdminServiceProviderDetails;
  locale: string;
}) {
  const tAdmin = useTranslations("AdminGenerated");
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

  const save = useAction(saveProviderGalleryItemAction, {
    startTransition,
    onSuccess: () => {
      toast.success(tAdmin("mediaItemSaved"));
      galleryForm.reset({
        title: createEmptyLocalizedContent(),
        description: createEmptyLocalizedContent(),
        url: "",
        mediaType: "image",
        displayOrder: 0,
      });
    },
    onError: ActionErrorToast,
  });
  const del = useAction(deleteProviderGalleryItemAction, {
    startTransition,
    onSuccess: () => toast.success(tAdmin("mediaItemDeleted")),
    onError: ActionErrorToast,
  });

  const onAddGalleryItem = galleryForm.handleSubmit((values) => {
    const normalizedUrl = normalizeMediaPickerValue(values.url);

    if (!normalizedUrl) {
      toast.error(tAdmin("pleasePickAMediaItemBeforeAddingItToTheGallery"));
      return;
    }

    save.execute({
      serviceProviderId: provider.id,
      title: normalizeLocalizedContentForDatabase(
        values.title,
        locale,
        SUPPORTED_LOCALE_HEADERS,
      ),
      description: normalizeLocalizedContentForDatabase(
        values.description,
        locale,
        SUPPORTED_LOCALE_HEADERS,
      ),
      url: normalizedUrl,
      mediaType: values.mediaType || "image",
      displayOrder: Number(values.displayOrder || 0),
    });
  });

  return (
    <RelationCard
      title={tAdmin("mediaGallery")}
      description="Manages category.provider_gallery_items. The media field uses the central media picker and stores the selected media URL."
    >
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed p-3">
        <p className="text-sm text-muted-foreground">
          Add several images in one go, or use the form below to add a single
          item with a title, description and order.
        </p>
        <ProviderGalleryPickerButton
          serviceProviderId={provider.id}
          label="Add images"
        />
      </div>

      <Form {...galleryForm}>
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_180px_140px_auto]">
          <FormField
            control={galleryForm.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <LocalizedInputBridge
                    label={tAdmin("title")}
                    value={field.value}
                    onChange={field.onChange}
                    locale={locale}
                    maxLength={250}
                  />
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
                  <LocalizedInputBridge
                    label={tAdmin("description")}
                    value={field.value}
                    onChange={field.onChange}
                    locale={locale}
                    richText
                    rows={4}
                    maxLength={2000}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <RHFSingleMediaPickerField
            control={galleryForm.control}
            name="url"
            label={tAdmin("media")}
            placeholder={tAdmin("pickMedia")}
            mediaType="all"
            helperText="Stores the selected media URL in provider_gallery_items.url."
            modalTitle="Pick gallery media"
          />
          <div className="grid gap-3">
            <FormField
              control={galleryForm.control}
              name="mediaType"
              render={({ field }) => (
                <FormItem>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={tAdmin("mediaType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">{tAdmin("image")}</SelectItem>
                      <SelectItem value="video">{tAdmin("video")}</SelectItem>
                      <SelectItem value="file">{tAdmin("file")}</SelectItem>
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
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder={tAdmin("order")}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <Button
            type="button"
            onClick={() => onAddGalleryItem()}
            disabled={isPending}
            className="self-start"
          >
            <Plus className="me-2 h-4 w-4" /> Add
          </Button>
        </div>
      </Form>
      <div className="space-y-2">
        {provider.galleryItems.length ? (
          provider.galleryItems.map((item) => (
            <div
              key={item.id}
              className="grid items-start gap-3 rounded-xl border p-3 md:grid-cols-[1fr_1fr_auto_auto]"
            >
              <div>
                <div className="font-medium">
                  {translationText(item.title, "Untitled")}
                </div>
                <RichTranslation
                  value={item.description}
                  fallback="No media description."
                />
                <div className="mt-1 text-sm text-muted-foreground">
                  {item.mediaType} · order {item.displayOrder}
                </div>
              </div>
              <code className="truncate rounded bg-muted px-2 py-1 text-xs">
                {item.url}
              </code>
              <Badge variant="outline">{item.mediaType}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  del.execute({ serviceProviderId: provider.id, id: item.id })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <EmptyState title={tAdmin("noGalleryItemsYet")} />
        )}
      </div>
    </RelationCard>
  );
}

type ProviderPolicyDraftForm = {
  policyTypeId: string;
  description: Record<string, unknown>;
};

function PoliciesManager({ provider, lookups, locale }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const policyForm = useForm<ProviderPolicyDraftForm>({
    defaultValues: {
      policyTypeId: "",
      description: createEmptyLocalizedContent(),
    },
  });
  const save = useAction(saveProviderPolicyAction, {
    startTransition,
    onSuccess: () => {
      toast.success(tAdmin("policySaved"));
      policyForm.reset({
        policyTypeId: "",
        description: createEmptyLocalizedContent(),
      });
      router.refresh();
    },
    onError: ActionErrorToast,
  });
  const del = useAction(deleteProviderPolicyAction, {
    startTransition,
    onSuccess: () => {
      toast.success(tAdmin("policyDeleted"));
      router.refresh();
    },
    onError: ActionErrorToast,
  });

  const onAddPolicy = policyForm.handleSubmit((values) => {
    const policyTypeId = String(values.policyTypeId || "").trim();
    const selectedPolicyType = lookups.policyTypes.find((item) => {
      const id = String(item.id || "").trim();
      const code = String(item.code || "").trim();
      return id === policyTypeId || code === policyTypeId;
    });
    const description = normalizeLocalizedContentForDatabase(
      values.description,
      locale,
      SUPPORTED_LOCALE_HEADERS,
    );

    if (!hasLocalizedMeaningfulContent(description)) {
      toast.error("Please enter a policy description.");
      return;
    }

    save.execute({
      serviceProviderId: provider.id,
      // provider_policy_type_id is nullable in the database. Do not block saving
      // if the lookup is empty or the admin wants a generic/custom policy.
      policyTypeId: policyTypeId || null,
      type: selectedPolicyType?.label
        ? normalizeLocalizedContentForDatabase(
            { [locale || "fa-IR"]: selectedPolicyType.label },
            locale,
            SUPPORTED_LOCALE_HEADERS,
          )
        : normalizeLocalizedContentForDatabase(
            { [locale || "fa-IR"]: "Policy" },
            locale,
            SUPPORTED_LOCALE_HEADERS,
          ),
      description,
    });
  });

  return (
    <RelationCard
      title={tAdmin("policies")}
      description="Cancellation, refund, admission, age, document, and house rules."
    >
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
                    onValueChange={(value) => {
                      policyForm.setValue("policyTypeId", String(value || "").trim(), {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                      policyForm.clearErrors("policyTypeId");
                    }}
                    placeholder={tAdmin("selectPolicyType")}
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
                  <LocalizedInputBridge
                    label={tAdmin("description")}
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      policyForm.clearErrors("description");
                    }}
                    locale={locale}
                    richText
                    rows={4}
                    maxLength={2000}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            onClick={() => onAddPolicy()}
            disabled={isPending}
            className="self-start"
          >
            <Plus className="me-2 h-4 w-4" /> Add
          </Button>
        </div>
      </Form>
      <div className="space-y-2">
        {provider.policies.length ? (
          provider.policies.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl border p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium">
                    {translationText(item.type)}
                  </div>
                  {item.policyTypeCode ? (
                    <Badge variant="outline">{item.policyTypeCode}</Badge>
                  ) : null}
                </div>
                <RichTranslation
                  value={item.description}
                  fallback="No policy description."
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  del.execute({ serviceProviderId: provider.id, id: item.id })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <EmptyState title={tAdmin("noPoliciesYet")} />
        )}
      </div>
    </RelationCard>
  );
}

function AttributesManager({ provider, lookups, locale }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const [isPending, startTransition] = useTransition();
  const [attributeDefinitionId, setAttributeDefinitionId] = useState("");
  const [value, setValue] = useState("");
  const save = useAction(saveProviderAttributeAction, {
    startTransition,
    onSuccess: () => {
      toast.success(tAdmin("attributeSaved"));
      setValue("");
    },
    onError: ActionErrorToast,
  });
  const del = useAction(deleteProviderAttributeAction, {
    startTransition,
    onSuccess: () => toast.success(tAdmin("attributeDeleted")),
    onError: ActionErrorToast,
  });

  return (
    <RelationCard
      title={tAdmin("providerAttributes")}
      description="Dynamic attributes configured per provider type."
    >
      <div className="grid gap-3 md:grid-cols-[320px_1fr_auto]">
        <LazyAdminLookupSelect
          lookupType="attributeDefinitions"
          locale={locale}
          value={attributeDefinitionId}
          onValueChange={setAttributeDefinitionId}
          placeholder={tAdmin("selectAttribute")}
          initialOptions={lookups.attributeDefinitions.filter(
            (item) => item.providerTypeId === provider.providerTypeId,
          )}
          queryParams={{ providerTypeId: provider.providerTypeId }}
          disabled={isPending}
          contentClassName="w-[420px]"
        />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={tAdmin("value")}
          disabled={isPending}
        />
        <Button
          onClick={() =>
            save.execute({
              serviceProviderId: provider.id,
              attributeDefinitionId,
              value: { "en-US": value },
            })
          }
          disabled={isPending || !attributeDefinitionId || !value.trim()}
        >
          <Plus className="me-2 h-4 w-4" /> Save
        </Button>
      </div>
      <div className="space-y-2">
        {provider.attributes.length ? (
          provider.attributes.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl border p-3"
            >
              <div>
                <div className="font-medium">{item.attributeName}</div>
                <p className="text-sm text-muted-foreground">
                  {translationText(item.value)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  del.execute({ serviceProviderId: provider.id, id: item.id })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <EmptyState title={tAdmin("noAttributesYet")} />
        )}
      </div>
    </RelationCard>
  );
}

type ServiceManagerFormValues = {
  serviceDefinitionId: string;
  displayName: Record<string, unknown>;
  description: Record<string, unknown>;
  currency: string;
  priceText: string;
  durationMinutes: string;
  trendingScoreText: string;
  imageUrl: unknown;
  isActive: boolean;
  isPopular: boolean;
  isFeatured: boolean;
  slotIntervalMinutes: string;
  tagsText: string;
};

function emptyServiceFormValues(
  defaultCurrency = "USD",
): ServiceManagerFormValues {
  return {
    serviceDefinitionId: "",
    displayName: createEmptyLocalizedContent(),
    description: createEmptyLocalizedContent(),
    currency: defaultCurrency,
    priceText: "0",
    durationMinutes: "0",
    trendingScoreText: "0",
    imageUrl: "",
    isActive: true,
    isPopular: false,
    isFeatured: false,
    slotIntervalMinutes: "15",
    tagsText: "",
  };
}

function ServicesManager({ provider, lookups, locale }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const serviceForm = useForm<ServiceManagerFormValues>({
    defaultValues: emptyServiceFormValues(lookups.currencies[0]?.code || "USD"),
  });

  const resetServiceForm = () => {
    setEditingServiceId(null);
    serviceForm.reset(
      emptyServiceFormValues(lookups.currencies[0]?.code || "USD"),
    );
  };

  const save = useAction(saveProviderServiceAction, {
    startTransition,
    onSuccess: () => {
      toast.success(editingServiceId ? "Service updated." : "Service saved.");
      resetServiceForm();
      setShowForm(false);
    },
    onError: ActionErrorToast,
  });
  const del = useAction(deleteProviderServiceAction, {
    startTransition,
    onSuccess: () => toast.success(tAdmin("serviceDeleted")),
    onError: ActionErrorToast,
  });

  const startCreate = () => {
    resetServiceForm();
    setShowForm(true);
  };

  const startEdit = (item: AdminServiceProviderDetails["services"][number]) => {
    setEditingServiceId(item.id);
    serviceForm.reset({
      serviceDefinitionId: item.serviceDefinitionId,
      displayName: toLocalizedInputValue(
        item.displayName,
        locale,
        SUPPORTED_LOCALE_HEADERS,
      ),
      description: toLocalizedInputValue(
        item.description,
        locale,
        SUPPORTED_LOCALE_HEADERS,
      ),
      currency: item.currency || lookups.currencies[0]?.code || "USD",
      priceText: formatNumberInput(item.value, locale),
      durationMinutes: String(item.durationMinutes ?? 0),
      trendingScoreText: formatNumberInput(item.trendingScore ?? 0, locale),
      imageUrl: item.imageUrl || "",
      isActive: item.isActive,
      isPopular: item.isPopular,
      isFeatured: item.isFeatured,
      slotIntervalMinutes: String(item.slotIntervalMinutes || 15),
      tagsText: item.tags.join(", "),
    });
    setShowForm(true);
  };

  const onSubmitService = serviceForm.handleSubmit((values) => {
    const displayName = normalizeLocalizedContentForDatabase(
      values.displayName,
      locale,
      SUPPORTED_LOCALE_HEADERS,
    );
    const description = normalizeLocalizedContentForDatabase(
      values.description,
      locale,
      SUPPORTED_LOCALE_HEADERS,
    );

    save.execute({
      serviceProviderId: provider.id,
      id: editingServiceId,
      serviceDefinitionId: values.serviceDefinitionId,
      displayName,
      description,
      isActive: values.isActive,
      currency: values.currency,
      value: parseFormattedNumber(values.priceText),
      durationMinutes: Number(values.durationMinutes || 0),
      trendingScore: parseFormattedNumber(values.trendingScoreText),
      imageUrl: normalizeMediaPickerValue(values.imageUrl) || null,
      isPopular: values.isPopular,
      isFeatured: values.isFeatured,
      tagsText: values.tagsText,
      slotIntervalMinutes: Number(values.slotIntervalMinutes || 15),
      addonIds:
        provider.services.find((item) => item.id === editingServiceId)
          ?.addonIds || [],
    });
  });

  const excludedServiceDefinitionIds = provider.services
    .filter((item) => item.id !== editingServiceId)
    .map((item) => item.serviceDefinitionId);

  return (
    <RelationCard
      title={tAdmin("providerServices")}
      description="Manages category.provider_services, provider_service_addons, and service image references."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Use the service definition selector, localized rich text fields,
          currency list, and media picker. Prices are formatted with thousands
          separators.
        </div>
        <Button
          type="button"
          onClick={startCreate}
          disabled={isPending}
          className="self-start sm:self-auto"
        >
          <Plus className="me-2 h-4 w-4" /> Add provider service
        </Button>
      </div>

      {showForm ? (
        <Card className="border-dashed bg-muted/20">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">
                  {editingServiceId
                    ? "Edit provider service"
                    : "Add provider service"}
                </CardTitle>
                <CardDescription>
                  Name and description keep the full localized JSON object,
                  including Lexical rich-text values.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetServiceForm();
                  setShowForm(false);
                }}
                disabled={isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...serviceForm}>
              <div className="space-y-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  <FormField
                    control={serviceForm.control}
                    name="serviceDefinitionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tAdmin("serviceDefinition")}</FormLabel>
                        <FormControl>
                          <LazyAdminLookupSelect
                            lookupType="serviceDefinitions"
                            locale={locale}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder={tAdmin("searchAndSelectServiceDefinition")}
                            searchPlaceholder="Search service definitions..."
                            initialOptions={lookups.serviceDefinitions}
                            excludeIds={excludedServiceDefinitionIds}
                            disabled={isPending}
                            contentClassName="w-[520px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={serviceForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tAdmin("currency")}</FormLabel>
                        <FormControl>
                          <LazyAdminLookupSelect
                            lookupType="currencies"
                            locale={locale}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder={tAdmin("selectCurrency")}
                            searchPlaceholder="Search currency..."
                            initialOptions={lookups.currencies}
                            valueField="code"
                            clearable={false}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={serviceForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <LocalizedInputBridge
                          label={tAdmin("displayName")}
                          value={field.value}
                          onChange={field.onChange}
                          locale={locale}
                          required
                          maxLength={250}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={serviceForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <LocalizedInputBridge
                          label={tAdmin("description")}
                          value={field.value}
                          onChange={field.onChange}
                          locale={locale}
                          richText
                          rows={5}
                          maxLength={3000}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={serviceForm.control}
                    name="priceText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tAdmin("price")}</FormLabel>
                        <FormControl>
                          <Input
                            dir="ltr"
                            inputMode="decimal"
                            value={field.value}
                            onChange={(event) =>
                              field.onChange(event.target.value)
                            }
                            onBlur={() =>
                              field.onChange(
                                formatNumberInput(field.value, locale),
                              )
                            }
                            placeholder="0"
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={serviceForm.control}
                    name="durationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tAdmin("durationMinutes")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={serviceForm.control}
                    name="trendingScoreText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trending score</FormLabel>
                        <FormControl>
                          <Input
                            dir="ltr"
                            inputMode="decimal"
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                            onBlur={() => field.onChange(formatNumberInput(field.value, locale))}
                            placeholder="0"
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={serviceForm.control}
                    name="slotIntervalMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tAdmin("slotIntervalMinutes")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                  <FormField
                    control={serviceForm.control}
                    name="tagsText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tAdmin("tags")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder={tAdmin("commaSeparatedTags")}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <RHFSingleMediaPickerField
                    control={serviceForm.control}
                    name="imageUrl"
                    label={tAdmin("serviceImage")}
                    placeholder={tAdmin("pickImage")}
                    mediaType="image"
                    helperText="Stores the selected media URL in provider_services.image_url."
                    modalTitle="Pick service image"
                    key="provider-service-image-url"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <FormField
                    control={serviceForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 rounded-xl border px-3 py-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="m-0">{tAdmin("active")}</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={serviceForm.control}
                    name="isPopular"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 rounded-xl border px-3 py-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="m-0">{tAdmin("popular")}</FormLabel>
                      </FormItem>
                    )}
                  />
                  {/* The single source of truth for the Featured Services shelf on the
                      app home page and /n/app/mobile/featured. Nothing is featured
                      unless it is ticked here. */}
                  <FormField
                    control={serviceForm.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 rounded-xl border px-3 py-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="m-0">
                          {tAdmin("featured")}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {tAdmin("featuredServiceHint")}
                </p>

                <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetServiceForm();
                      setShowForm(false);
                    }}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => onSubmitService()}
                    disabled={
                      isPending || !serviceForm.watch("serviceDefinitionId")
                    }
                  >
                    <Plus className="me-2 h-4 w-4" />{" "}
                    {editingServiceId ? "Save service" : "Add service"}
                  </Button>
                </div>
              </div>
            </Form>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {provider.services.length ? (
          provider.services.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border p-4 transition-colors hover:bg-muted/20"
              dir="auto"
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div className="min-w-0 space-y-2 text-start">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-base font-semibold">
                      {translationText(
                        item.displayName,
                        item.serviceDefinitionName,
                      )}
                    </div>
                    {item.isFeatured ? (
                      <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                        {tAdmin("featured")}
                      </Badge>
                    ) : null}
                    {item.isPopular ? <Badge>{tAdmin("popular")}</Badge> : null}
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{item.serviceDefinitionName}</span>
                    {item.categoryName ? (
                      <span>{item.categoryName}</span>
                    ) : null}
                    <span>{item.durationMinutes} min</span>
                    <span className="font-medium text-foreground">
                      {formatMoney(item.value, item.currency, locale)}
                    </span>
                    <span>
                      {item.rating} ★ / {item.reviewCount} reviews
                    </span>
                    <span>Trending: {item.trendingScore ?? 0}</span>
                  </div>
                  <RichTranslation
                    value={item.description}
                    fallback="No service description."
                  />
                  {item.tags.length ? (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(item)}
                    disabled={isPending}
                  >
                    <Edit className="me-2 h-4 w-4" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      del.execute({
                        serviceProviderId: provider.id,
                        id: item.id,
                      })
                    }
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState title={tAdmin("noProviderServicesYet")} />
        )}
      </div>
    </RelationCard>
  );
}

function StaffManager({ provider, lookups, locale }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const [isPending, startTransition] = useTransition();
  const [staffId, setStaffId] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const save = useAction(saveProviderStaffAction, {
    startTransition,
    onSuccess: () => {
      toast.success(tAdmin("staffLinked"));
      setNotes("");
    },
    onError: ActionErrorToast,
  });
  const del = useAction(deleteProviderStaffAction, {
    startTransition,
    onSuccess: () => toast.success(tAdmin("staffUnlinked")),
    onError: ActionErrorToast,
  });

  return (
    <RelationCard
      title={tAdmin("providerStaff")}
      description="Links specialists/staff to this provider."
    >
      <div className="grid gap-3 md:grid-cols-[320px_1fr_auto]">
        <LazyAdminLookupSelect
          lookupType="staff"
          locale={locale}
          value={staffId}
          onValueChange={setStaffId}
          placeholder={tAdmin("selectStaff")}
          initialOptions={lookups.staff}
          excludeIds={provider.staff.map((item) => item.staffId)}
          disabled={isPending}
          contentClassName="w-[420px]"
        />
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={tAdmin("notes")}
          disabled={isPending}
        />
        <Button
          onClick={() =>
            save.execute({
              serviceProviderId: provider.id,
              staffId,
              notes: { "en-US": notes },
              isActive,
            })
          }
          disabled={isPending || !staffId}
        >
          <Plus className="me-2 h-4 w-4" /> Link
        </Button>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={isActive}
          onCheckedChange={(v) => setIsActive(Boolean(v))}
        />{" "}
        New link active
      </label>
      <div className="space-y-2">
        {provider.staff.length ? (
          provider.staff.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl border p-3"
            >
              <div>
                <div className="font-medium">{item.staffName}</div>
                <div className="text-sm text-muted-foreground">
                  {text(item.staffTitle)} ·{" "}
                  {item.isActive ? "Active" : "Inactive"}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  del.execute({ serviceProviderId: provider.id, id: item.id })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <EmptyState title={tAdmin("noStaffLinkedYet")} />
        )}
      </div>
    </RelationCard>
  );
}

type ReviewTargetOption = "provider" | "service" | "specialist";
type ReviewModerationStatus = "pending" | "approved" | "rejected";

const emptyReviewDraft = {
  reviewTarget: "provider" as ReviewTargetOption,
  providerServiceId: "",
  staffId: "",
  customerName: "LSevin editorial team",
  country: "",
  treatment: "",
  rating: 5,
  commentText: "",
  isVerified: false,
  helpfulCount: 0,
  notHelpfulCount: 0,
  prosText: "",
  consText: "",
  moderationStatus: "approved" as ReviewModerationStatus,
};

function splitReviewHighlights(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]+/g)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, 8);
}

function ReviewsManager({
  provider,
}: {
  provider: AdminServiceProviderDetails;
}) {
  const tAdmin = useTranslations("AdminGenerated");
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState(emptyReviewDraft);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const update = useAction(updateProviderCommentModerationAction, {
    startTransition,
    onSuccess: () => toast.success(tAdmin("reviewUpdated")),
    onError: ActionErrorToast,
  });
  const del = useAction(deleteProviderCommentAction, {
    startTransition,
    onSuccess: () => toast.success(tAdmin("reviewDeleted")),
    onError: ActionErrorToast,
  });
  const save = useAction(saveProviderCommentAction, {
    startTransition,
    onSuccess: () => {
      toast.success(tAdmin("sEOAdminReviewAdded"));
      setDraft(emptyReviewDraft);
    },
    onError: ActionErrorToast,
  });
  const saveReply = useAction(saveProviderCommentReplyAction, {
    startTransition,
    onSuccess: () => {
      toast.success(tAdmin("reviewReplyAdded"));
      setReplyDrafts({});
    },
    onError: ActionErrorToast,
  });
  const updateReply = useAction(updateProviderCommentReplyModerationAction, {
    startTransition,
    onSuccess: () => toast.success(tAdmin("reviewReplyUpdated")),
    onError: ActionErrorToast,
  });
  const deleteReply = useAction(deleteProviderCommentReplyAction, {
    startTransition,
    onSuccess: () => toast.success(tAdmin("reviewReplyDeleted")),
    onError: ActionErrorToast,
  });

  const submitAdminReview = () => {
    save.execute({
      serviceProviderId: provider.id,
      reviewTarget: draft.reviewTarget,
      providerServiceId:
        draft.reviewTarget === "service"
          ? draft.providerServiceId || null
          : null,
      staffId:
        draft.reviewTarget === "specialist" ? draft.staffId || null : null,
      customerName: draft.customerName,
      country: draft.country || null,
      treatment: draft.treatment || null,
      commentText: draft.commentText,
      rating: draft.rating,
      isVerified: draft.isVerified,
      helpfulCount: draft.helpfulCount,
      notHelpfulCount: draft.notHelpfulCount,
      pros: splitReviewHighlights(draft.prosText),
      cons: splitReviewHighlights(draft.consText),
      moderationStatus: draft.moderationStatus,
    });
  };

  const submitAdminReply = (reviewId: string) => {
    const replyText = String(replyDrafts[reviewId] || "").trim();
    if (replyText.length < 2) return;
    saveReply.execute({
      serviceProviderId: provider.id,
      reviewId,
      authorName: "LSevin admin",
      replyText,
      moderationStatus: "approved",
      isVerified: true,
    });
  };

  const setModeration = (
    item: (typeof provider.comments)[number],
    moderationStatus: ReviewModerationStatus,
  ) => {
    update.execute({
      serviceProviderId: provider.id,
      id: item.id,
      isPublic: moderationStatus === "approved",
      moderationStatus,
      isVerified: item.isVerified,
      helpfulCount: item.helpfulCount,
      notHelpfulCount: item.notHelpfulCount,
    });
  };

  return (
    <RelationCard
      title={tAdmin("reviewsAndComments")}
      description="Customer feedback is booking-gated and stays pending until admin approval. Admin can also add public SEO reviews."
    >
      <div className="rounded-2xl border bg-muted/20 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">{tAdmin("addAdminSEOReview")}</div>
            <p className="text-sm text-muted-foreground">
              Use this only for curated editorial comments or imported reviews.
              Customer reviews should come from booked customers.
            </p>
          </div>
          <Badge variant="outline">{tAdmin("adminCreated")}</Badge>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <Input
            value={draft.customerName}
            onChange={(e) =>
              setDraft((v) => ({ ...v, customerName: e.target.value }))
            }
            placeholder={tAdmin("reviewerName")}
            disabled={isPending}
          />
          <Input
            value={draft.country}
            onChange={(e) =>
              setDraft((v) => ({ ...v, country: e.target.value }))
            }
            placeholder={tAdmin("country")}
            disabled={isPending}
          />
          <Input
            value={draft.treatment}
            onChange={(e) =>
              setDraft((v) => ({ ...v, treatment: e.target.value }))
            }
            placeholder={tAdmin("treatmentSEOTitle")}
            disabled={isPending}
          />
          <Select
            value={draft.reviewTarget}
            onValueChange={(value) =>
              setDraft((v) => ({
                ...v,
                reviewTarget: value as ReviewTargetOption,
                providerServiceId: "",
                staffId: "",
              }))
            }
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder={tAdmin("target")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="provider">{tAdmin("provider")}</SelectItem>
              <SelectItem value="service">{tAdmin("service")}</SelectItem>
              <SelectItem value="specialist">{tAdmin("specialist")}</SelectItem>
            </SelectContent>
          </Select>
          {draft.reviewTarget === "service" ? (
            <Select
              value={draft.providerServiceId}
              onValueChange={(value) =>
                setDraft((v) => ({ ...v, providerServiceId: value }))
              }
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={tAdmin("providerService")} />
              </SelectTrigger>
              <SelectContent>
                {provider.services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {translationText(
                      service.displayName,
                      service.serviceDefinitionName,
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {draft.reviewTarget === "specialist" ? (
            <Select
              value={draft.staffId}
              onValueChange={(value) =>
                setDraft((v) => ({ ...v, staffId: value }))
              }
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={tAdmin("specialist")} />
              </SelectTrigger>
              <SelectContent>
                {provider.staff.map((staff) => (
                  <SelectItem key={staff.staffId} value={staff.staffId}>
                    {staff.staffName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Input
            type="number"
            min={1}
            max={5}
            value={draft.rating}
            onChange={(e) =>
              setDraft((v) => ({ ...v, rating: Number(e.target.value || 5) }))
            }
            placeholder={tAdmin("rating")}
            disabled={isPending}
          />
          <Input
            type="number"
            min={0}
            value={draft.helpfulCount}
            onChange={(e) =>
              setDraft((v) => ({ ...v, helpfulCount: Number(e.target.value || 0) }))
            }
            placeholder={tAdmin("helpfulVotes")}
            disabled={isPending}
          />
          <Input
            type="number"
            min={0}
            value={draft.notHelpfulCount}
            onChange={(e) =>
              setDraft((v) => ({ ...v, notHelpfulCount: Number(e.target.value || 0) }))
            }
            placeholder={tAdmin("dislikeVotes")}
            disabled={isPending}
          />
          <Select
            value={draft.moderationStatus}
            onValueChange={(value) =>
              setDraft((v) => ({
                ...v,
                moderationStatus: value as ReviewModerationStatus,
              }))
            }
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder={tAdmin("status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approved">{tAdmin("approvedPublic")}</SelectItem>
              <SelectItem value="pending">{tAdmin("pending")}</SelectItem>
              <SelectItem value="rejected">{tAdmin("rejectedHidden")}</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm">
            <Checkbox
              checked={draft.isVerified}
              onCheckedChange={(v) =>
                setDraft((current) => ({ ...current, isVerified: Boolean(v) }))
              }
              disabled={isPending}
            />
            Verified badge
          </label>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <textarea
            value={draft.prosText}
            onChange={(e) =>
              setDraft((v) => ({ ...v, prosText: e.target.value }))
            }
            placeholder={tAdmin("prosOnePerLineOrCommaSeparated")}
            rows={3}
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            disabled={isPending}
          />
          <textarea
            value={draft.consText}
            onChange={(e) =>
              setDraft((v) => ({ ...v, consText: e.target.value }))
            }
            placeholder={tAdmin("consOnePerLineOrCommaSeparated")}
            rows={3}
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            disabled={isPending}
          />
        </div>
        <textarea
          value={draft.commentText}
          onChange={(e) =>
            setDraft((v) => ({ ...v, commentText: e.target.value }))
          }
          placeholder={tAdmin("reviewText")}
          rows={4}
          className="mt-3 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          disabled={isPending}
        />
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            onClick={submitAdminReview}
            disabled={
              isPending ||
              draft.commentText.trim().length < 10 ||
              !draft.customerName.trim()
            }
          >
            <Plus className="me-2 h-4 w-4" /> Add review
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {provider.comments.length ? (
          provider.comments.map((item) => (
            <div key={item.id} className="rounded-xl border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div>
                    <div className="font-medium">
                      {item.customerName} · {item.rating ?? "-"} ★
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.reviewTarget === "service"
                        ? `Service: ${item.providerServiceName || item.providerServiceId}`
                        : item.reviewTarget === "specialist"
                          ? `Specialist: ${item.staffName || item.staffId}`
                          : "Provider review"}
                      {item.treatment ? ` · ${item.treatment}` : ""}
                      {item.createdByAdmin ? " · Admin/SEO" : " · Customer"}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.commentText}
                  </p>
                  {(item.pros?.length || item.cons?.length) ? (
                    <div className="grid gap-2 text-xs lg:grid-cols-2">
                      {item.pros?.length ? (
                        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-800">
                          <div className="mb-1 font-semibold">{tAdmin("pros")}</div>
                          {item.pros.map((point) => <div key={point}>+ {point}</div>)}
                        </div>
                      ) : null}
                      {item.cons?.length ? (
                        <div className="rounded-lg bg-rose-50 p-2 text-rose-800">
                          <div className="mb-1 font-semibold">{tAdmin("cons")}</div>
                          {item.cons.map((point) => <div key={point}>- {point}</div>)}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge
                      variant={
                        item.moderationStatus === "approved"
                          ? "default"
                          : item.moderationStatus === "pending"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {item.moderationStatus}
                    </Badge>
                    <Badge variant={item.isPublic ? "default" : "secondary"}>
                      {item.isPublic ? "Public" : "Hidden"}
                    </Badge>
                    {item.isVerified ? (
                      <Badge variant="outline">{tAdmin("verifiedBooking")}</Badge>
                    ) : null}
                    <Badge variant="outline">Helpful {item.helpfulCount}</Badge>
                    <Badge variant="outline">Dislike {item.notHelpfulCount}</Badge>
                    {item.country ? (
                      <Badge variant="outline">{item.country}</Badge>
                    ) : null}
                  </div>
                  {item.replies?.length ? (
                    <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Replies
                      </div>
                      {item.replies.map((reply) => (
                        <div key={reply.id} className="rounded-lg border bg-background p-2">
                          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold">{reply.authorName}</span>
                            <Badge variant={reply.authorRole === "admin" ? "default" : "outline"}>
                              {reply.authorRole === "admin" ? "Admin" : "Booked customer"}
                            </Badge>
                            <Badge
                              variant={
                                reply.moderationStatus === "approved"
                                  ? "default"
                                  : reply.moderationStatus === "pending"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {reply.moderationStatus}
                            </Badge>
                            {reply.isVerified ? <Badge variant="outline">{tAdmin("verified")}</Badge> : null}
                            <span className="text-muted-foreground">{dateText(reply.createDate)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{reply.replyText}</p>
                          <div className="mt-2 flex flex-wrap justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateReply.execute({
                                  serviceProviderId: provider.id,
                                  replyId: reply.id,
                                  moderationStatus: "approved",
                                  isVerified: reply.isVerified,
                                })
                              }
                              disabled={isPending}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateReply.execute({
                                  serviceProviderId: provider.id,
                                  replyId: reply.id,
                                  moderationStatus: "rejected",
                                  isVerified: reply.isVerified,
                                })
                              }
                              disabled={isPending}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateReply.execute({
                                  serviceProviderId: provider.id,
                                  replyId: reply.id,
                                  moderationStatus: "pending",
                                  isVerified: reply.isVerified,
                                })
                              }
                              disabled={isPending}
                            >
                              Pending
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                deleteReply.execute({
                                  serviceProviderId: provider.id,
                                  replyId: reply.id,
                                })
                              }
                              disabled={isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="rounded-xl border bg-background p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Admin answer
                    </div>
                    <textarea
                      value={replyDrafts[item.id] || ""}
                      onChange={(event) =>
                        setReplyDrafts((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder={tAdmin("answerThisReviewAsAdmin")}
                      rows={3}
                      maxLength={1000}
                      className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      disabled={isPending}
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => submitAdminReply(item.id)}
                        disabled={isPending || String(replyDrafts[item.id] || "").trim().length < 2}
                      >
                        <Plus className="me-2 h-4 w-4" /> Add reply
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {dateText(item.createDate)}
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModeration(item, "approved")}
                    disabled={isPending}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModeration(item, "rejected")}
                    disabled={isPending}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModeration(item, "pending")}
                    disabled={isPending}
                  >
                    Pending
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      update.execute({
                        serviceProviderId: provider.id,
                        id: item.id,
                        isPublic: item.isPublic,
                        moderationStatus: item.moderationStatus,
                        isVerified: !item.isVerified,
                        helpfulCount: item.helpfulCount,
                        notHelpfulCount: item.notHelpfulCount,
                      })
                    }
                    disabled={isPending}
                  >
                    {item.isVerified ? "Unverify" : "Verify"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      del.execute({
                        serviceProviderId: provider.id,
                        id: item.id,
                      })
                    }
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState title={tAdmin("noReviewsYet")} />
        )}
      </div>
    </RelationCard>
  );
}

function RequestsManager({ provider, lookups, locale }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const [isPending, startTransition] = useTransition();
  const update = useAction(updateProviderRequestStatusAction, {
    startTransition,
    onSuccess: () => toast.success(tAdmin("requestStatusUpdated")),
    onError: ActionErrorToast,
  });
  return (
    <RelationCard
      title={tAdmin("providerRequests")}
      description="Admin status workflow for service_provider_requests."
    >
      <div className="space-y-2">
        {provider.requests.length ? (
          provider.requests.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-xl border p-3 lg:grid-cols-[1fr_220px]"
            >
              <div>
                <div className="font-medium">
                  {item.customerFullName} · {item.customerEmail}
                </div>
                <p className="text-sm text-muted-foreground">{item.message}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Created {dateText(item.createDate)}
                </div>
              </div>
              <LazyAdminLookupSelect
                lookupType="requestStatuses"
                locale={locale}
                value={String(item.requestStatusId)}
                onValueChange={(value) =>
                  value &&
                  update.execute({
                    serviceProviderId: provider.id,
                    id: item.id,
                    requestStatusId: Number(value),
                  })
                }
                placeholder={tAdmin("requestStatus")}
                initialOptions={lookups.requestStatuses}
                disabled={isPending}
                clearable={false}
              />
            </div>
          ))
        ) : (
          <EmptyState title={tAdmin("noProviderRequests")} />
        )}
      </div>
    </RelationCard>
  );
}

function BookingsTab({ provider }: { provider: AdminServiceProviderDetails }) {
  const tAdmin = useTranslations("AdminGenerated");
  return (
    <RelationCard
      title={tAdmin("bookingsAndDrafts")}
      description="Read-only operational snapshot from booking.bookings and booking.booking_drafts."
    >
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 font-medium">{tAdmin("bookings")}</h3>
          <div className="space-y-2">
            {provider.bookings.length ? (
              provider.bookings.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 rounded-xl border p-3 text-sm lg:grid-cols-[1fr_auto_auto_auto]"
                >
                  <div>
                    <div className="font-medium">{item.serviceName}</div>
                    <div className="text-muted-foreground">
                      {item.specialistName} · {item.selectedDate}{" "}
                      {item.selectedTimeFrom}-{item.selectedTimeTo}
                    </div>
                  </div>
                  <Badge>{item.bookingStatus}</Badge>
                  <Badge variant="outline">{text(item.paymentStatus)}</Badge>
                  <div>
                    {item.currencyCode || ""} {item.totalAmount ?? 0}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title={tAdmin("noBookingsLoaded")} />
            )}
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-medium">{tAdmin("drafts")}</h3>
          <div className="space-y-2">
            {provider.bookingDrafts.length ? (
              provider.bookingDrafts.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 rounded-xl border p-3 text-sm lg:grid-cols-[1fr_auto_auto]"
                >
                  <div>
                    <div className="font-medium">
                      {item.serviceName || "No service selected"}
                    </div>
                    <div className="text-muted-foreground">
                      Step {item.currentStep} · updated{" "}
                      {dateText(item.updatedAt)}
                    </div>
                  </div>
                  <Badge variant="outline">{item.status}</Badge>
                  <div>
                    {item.currency} {item.totalAmount}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title={tAdmin("noDraftsLoaded")} />
            )}
          </div>
        </div>
      </div>
    </RelationCard>
  );
}

function RecommendationsManager({ provider, lookups, locale }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const [isPending, startTransition] = useTransition();
  const [targetProviderId, setTargetProviderId] = useState("");
  const [type, setType] = useState("similar");
  const save = useAction(saveProviderRecommendationAction, {
    startTransition,
    onSuccess: () => toast.success(tAdmin("recommendationSaved")),
    onError: ActionErrorToast,
  });
  const del = useAction(deleteProviderRecommendationAction, {
    startTransition,
    onSuccess: () => toast.success(tAdmin("recommendationDeleted")),
    onError: ActionErrorToast,
  });
  return (
    <RelationCard
      title={tAdmin("recommendations")}
      description="Controls local/international/similar provider recommendations."
    >
      <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <LazyAdminLookupSelect
          lookupType="providers"
          locale={locale}
          value={targetProviderId}
          onValueChange={setTargetProviderId}
          placeholder={tAdmin("targetProvider")}
          initialOptions={lookups.providers.filter(
            (item) => String(item.id) !== provider.id,
          )}
          queryParams={{ excludeProviderId: provider.id }}
          disabled={isPending}
          contentClassName="w-[460px]"
        />
        <Input
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="similar/local/international"
          disabled={isPending}
        />
        <Button
          onClick={() =>
            save.execute({
              serviceProviderId: provider.id,
              targetProviderId,
              type,
            })
          }
          disabled={isPending || !targetProviderId || !type.trim()}
        >
          <Plus className="me-2 h-4 w-4" /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {provider.recommendations.length ? (
          provider.recommendations.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border p-3"
            >
              <div>
                <div className="font-medium">{item.targetProviderName}</div>
                <div className="text-sm text-muted-foreground">{item.type}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  del.execute({ serviceProviderId: provider.id, id: item.id })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <EmptyState title={tAdmin("noRecommendationsYet")} />
        )}
      </div>
    </RelationCard>
  );
}

function RelationCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
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
