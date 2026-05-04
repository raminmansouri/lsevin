"use client";

import { useMemo, useState, useTransition, type ComponentType } from "react";
import {
  Bell,
  Copy,
  Edit,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SUPPORTED_LOCALE_HEADERS } from "@/config/locales";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import useAction from "@/hooks/use-action";

import {
  deleteNotificationTemplateAction,
  saveNotificationTemplateAction,
} from "../../actions/admin-templates";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  type AdminNotificationTemplatesPageData,
  type AdminNotificationTemplate,
  type NotificationChannel,
  type NotificationType,
  type TranslationRecord,
} from "../../types/notification-template-types";

type LocalizedContentValue = { translations: TranslationRecord };

type TemplateDraft = {
  id?: string | null;
  templateKey: string;
  name: string;
  description: string;
  notificationType: NotificationType;
  defaultChannels: NotificationChannel[];
  titleTranslations: TranslationRecord;
  bodyTranslations: TranslationRecord;
  emailSubjectTranslations: TranslationRecord;
  emailBodyTranslations: TranslationRecord;
  smsBodyTranslations: TranslationRecord;
  pushTitleTranslations: TranslationRecord;
  pushBodyTranslations: TranslationRecord;
  variables: string[];
  isActive: boolean;
  metadata: Record<string, unknown>;
};

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  in_app: "In-app",
  email: "Email",
  sms: "SMS",
  push: "Push",
  phone_call: "Phone call",
};

const CHANNEL_ICONS: Record<NotificationChannel, ComponentType<{ className?: string }>> = {
  in_app: Bell,
  email: Mail,
  sms: MessageSquare,
  push: Smartphone,
  phone_call: Phone,
};

const TYPE_LABELS: Record<NotificationType, string> = {
  booking: "Booking",
  offer: "Offer",
  system: "System",
};

function toLocalizedContent(value?: TranslationRecord | null): LocalizedContentValue {
  return { translations: value || {} };
}

function fromLocalizedContent(value: LocalizedContentValue): TranslationRecord {
  return value.translations || {};
}

function emptyDraft(): TemplateDraft {
  return {
    id: null,
    templateKey: "",
    name: "",
    description: "",
    notificationType: "system",
    defaultChannels: ["in_app"],
    titleTranslations: {},
    bodyTranslations: {},
    emailSubjectTranslations: {},
    emailBodyTranslations: {},
    smsBodyTranslations: {},
    pushTitleTranslations: {},
    pushBodyTranslations: {},
    variables: [],
    isActive: true,
    metadata: {},
  };
}

function cloneDraft(item: AdminNotificationTemplate): TemplateDraft {
  return {
    id: item.id,
    templateKey: item.templateKey,
    name: item.name,
    description: item.description || "",
    notificationType: item.notificationType,
    defaultChannels: item.defaultChannels.length ? item.defaultChannels : ["in_app"],
    titleTranslations: item.titleTranslations || {},
    bodyTranslations: item.bodyTranslations || {},
    emailSubjectTranslations: item.emailSubjectTranslations || {},
    emailBodyTranslations: item.emailBodyTranslations || {},
    smsBodyTranslations: item.smsBodyTranslations || {},
    pushTitleTranslations: item.pushTitleTranslations || {},
    pushBodyTranslations: item.pushBodyTranslations || {},
    variables: item.variables || [],
    isActive: item.isActive,
    metadata: item.metadata || {},
  };
}

function duplicateDraft(item: AdminNotificationTemplate): TemplateDraft {
  return {
    ...cloneDraft(item),
    id: null,
    templateKey: `${item.templateKey}.copy`,
    name: `${item.name} copy`,
  };
}

function formatDate(value?: string | null) {
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

function firstText(value?: TranslationRecord | null, fallback = "") {
  if (!value) return fallback;
  return (
    value["en-US"] ||
    value.en ||
    value["fa-IR"] ||
    value.fa ||
    Object.values(value).find((item) => item?.trim()) ||
    fallback
  );
}

function renderPreview(template: string, variables: string[]) {
  return template.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_, key: string) => {
    if (variables.includes(key)) return `[${key}]`;
    return `[${key}]`;
  });
}

function normalizeVariablesText(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim().replace(/^{{|}}$/g, "").trim())
        .filter(Boolean),
    ),
  );
}

function variablesText(variables: string[]) {
  return variables.join(", ");
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

function ChannelBadge({ channel }: { channel: NotificationChannel }) {
  const Icon = CHANNEL_ICONS[channel];
  return (
    <Badge variant="secondary" className="gap-1">
      <Icon className="h-3 w-3" />
      {CHANNEL_LABELS[channel]}
    </Badge>
  );
}

function MissingTableWarning() {
  return (
    <Card className="border-amber-200 bg-amber-50/60">
      <CardHeader>
        <CardTitle className="text-amber-900">Notification template table is not installed</CardTitle>
        <CardDescription className="text-amber-800">
          Run <code>database/migrations/20260504_notify_notification_templates.sql</code> before using this page.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function TemplateToolbar({ tableMissing }: { tableMissing: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("filters") || "");

  const commitSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const normalized = value.trim();

    if (normalized) params.set("filters", normalized);
    else params.delete("filters");

    params.delete("pageNumber");
    params.delete("page");

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }, 350);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) params.delete(key);
    else params.set(key, value);
    params.delete("pageNumber");

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              commitSearch(event.target.value);
            }}
            placeholder="Search keys, names, content, variables..."
            className="h-9 pl-9 pr-9"
            disabled={tableMissing}
          />
          {search ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => {
                setSearch("");
                commitSearch("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <Select
          value={searchParams.get("notificationType") || "all"}
          onValueChange={(value) => updateParam("notificationType", value)}
          disabled={tableMissing}
        >
          <SelectTrigger className="h-9 w-full sm:w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {NOTIFICATION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("channel") || "all"}
          onValueChange={(value) => updateParam("channel", value)}
          disabled={tableMissing}
        >
          <SelectTrigger className="h-9 w-full sm:w-[160px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            {NOTIFICATION_CHANNELS.map((channel) => (
              <SelectItem key={channel} value={channel}>
                {CHANNEL_LABELS[channel]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("isActive") || "all"}
          onValueChange={(value) => updateParam("isActive", value)}
          disabled={tableMissing}
        >
          <SelectTrigger className="h-9 w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" onClick={() => router.refresh()} disabled={tableMissing}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh
      </Button>
    </div>
  );
}

function TemplateEditor({
  draft,
  onChange,
  onCancel,
  onSave,
  isPending,
}: {
  draft: TemplateDraft;
  onChange: (draft: TemplateDraft) => void;
  onCancel: () => void;
  onSave: () => void;
  isPending: boolean;
}) {
  const previewTitle = renderPreview(firstText(draft.titleTranslations, "Notification title"), draft.variables);
  const previewBody = renderPreview(firstText(draft.bodyTranslations, "Notification body"), draft.variables);

  const set = <K extends keyof TemplateDraft>(key: K, value: TemplateDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };

  const toggleChannel = (channel: NotificationChannel, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...draft.defaultChannels, channel]))
      : draft.defaultChannels.filter((item) => item !== channel);

    set("defaultChannels", next.length ? next : ["in_app"]);
  };

  return (
    <Card className="border-[#083f30]/20 shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{draft.id ? "Edit notification template" : "Create notification template"}</CardTitle>
            <CardDescription>
              Use placeholders like <code>{"{{customerName}}"}</code> and list them in the variables field.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button type="button" onClick={onSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save template"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="templateKey">Template key</Label>
                <Input
                  id="templateKey"
                  dir="ltr"
                  value={draft.templateKey}
                  onChange={(event) => set("templateKey", event.target.value)}
                  placeholder="booking.created.customer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateName">Name</Label>
                <Input
                  id="templateName"
                  value={draft.name}
                  onChange={(event) => set("name", event.target.value)}
                  placeholder="Booking created - customer"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[200px_1fr]">
              <div className="space-y-2">
                <Label>Notification type</Label>
                <Select
                  value={draft.notificationType}
                  onValueChange={(value) => set("notificationType", value as NotificationType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={draft.description}
                  onChange={(event) => set("description", event.target.value)}
                  rows={2}
                  placeholder="Explain when this template is used."
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <Label>Default channels</Label>
                  <p className="text-sm text-muted-foreground">These channels are queued unless caller overrides them.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={draft.isActive} onCheckedChange={(checked) => set("isActive", checked)} />
                  <span className="text-sm font-medium">{draft.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {NOTIFICATION_CHANNELS.map((channel) => {
                  const Icon = CHANNEL_ICONS[channel];
                  const checked = draft.defaultChannels.includes(channel);
                  return (
                    <label key={channel} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/50">
                      <Checkbox checked={checked} onCheckedChange={(value) => toggleChannel(channel, Boolean(value))} />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {CHANNEL_LABELS[channel]}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Variables</Label>
              <Input
                dir="ltr"
                value={variablesText(draft.variables)}
                onChange={(event) => set("variables", normalizeVariablesText(event.target.value))}
                placeholder="customerName, bookingCode, amount, currency"
              />
              <p className="text-sm text-muted-foreground">
                Separate variables with commas. Use them inside text as <code>{"{{variableName}}"}</code>.
              </p>
            </div>
          </div>

          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Live preview</CardTitle>
              <CardDescription>Preview uses the first available locale.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-background p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#083f30]" />
                  <span className="font-semibold">{previewTitle}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{previewBody}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Variables</p>
                <div className="flex flex-wrap gap-1.5">
                  {draft.variables.length ? (
                    draft.variables.map((variable) => (
                      <Badge key={variable} variant="outline" dir="ltr">
                        {`{{${variable}}}`}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No variables documented.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="in_app" className="space-y-4">
          <TabsList className="flex h-auto w-full flex-wrap justify-start">
            <TabsTrigger value="in_app">In-app</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="push">Push</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="in_app" className="space-y-4">
            <LocalizedInput
              label="In-app title"
              value={toLocalizedContent(draft.titleTranslations)}
              onChange={(value) => set("titleTranslations", fromLocalizedContent(value))}
              supportedLocales={SUPPORTED_LOCALE_HEADERS}
              maxLength={250}
            />
            <LocalizedInput
              label="In-app body"
              value={toLocalizedContent(draft.bodyTranslations)}
              onChange={(value) => set("bodyTranslations", fromLocalizedContent(value))}
              supportedLocales={SUPPORTED_LOCALE_HEADERS}
              multiline
              rows={4}
            />
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <LocalizedInput
              label="Email subject"
              value={toLocalizedContent(draft.emailSubjectTranslations)}
              onChange={(value) => set("emailSubjectTranslations", fromLocalizedContent(value))}
              supportedLocales={SUPPORTED_LOCALE_HEADERS}
              maxLength={250}
            />
            <LocalizedInput
              label="Email body"
              value={toLocalizedContent(draft.emailBodyTranslations)}
              onChange={(value) => set("emailBodyTranslations", fromLocalizedContent(value))}
              supportedLocales={SUPPORTED_LOCALE_HEADERS}
              multiline
              rows={8}
            />
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <LocalizedInput
              label="SMS body"
              value={toLocalizedContent(draft.smsBodyTranslations)}
              onChange={(value) => set("smsBodyTranslations", fromLocalizedContent(value))}
              supportedLocales={SUPPORTED_LOCALE_HEADERS}
              multiline
              rows={4}
              maxLength={500}
              description="Keep SMS text short. Providers can still split long messages later."
            />
          </TabsContent>

          <TabsContent value="push" className="space-y-4">
            <LocalizedInput
              label="Push title"
              value={toLocalizedContent(draft.pushTitleTranslations)}
              onChange={(value) => set("pushTitleTranslations", fromLocalizedContent(value))}
              supportedLocales={SUPPORTED_LOCALE_HEADERS}
              maxLength={100}
            />
            <LocalizedInput
              label="Push body"
              value={toLocalizedContent(draft.pushBodyTranslations)}
              onChange={(value) => set("pushBodyTranslations", fromLocalizedContent(value))}
              supportedLocales={SUPPORTED_LOCALE_HEADERS}
              multiline
              rows={3}
              maxLength={240}
            />
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <div className="space-y-2">
              <Label>Metadata JSON</Label>
              <Textarea
                dir="ltr"
                rows={8}
                value={JSON.stringify(draft.metadata || {}, null, 2)}
                onChange={(event) => {
                  try {
                    set("metadata", JSON.parse(event.target.value || "{}"));
                  } catch {
                    // Keep invalid intermediate JSON out of state; admins can paste again.
                  }
                }}
              />
              <p className="text-sm text-muted-foreground">Optional advanced settings for workers/providers.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TemplateCard({
  item,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  item: AdminNotificationTemplate;
  onEdit: (item: AdminNotificationTemplate) => void;
  onDuplicate: (item: AdminNotificationTemplate) => void;
  onDelete: (item: AdminNotificationTemplate) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Active" : "Inactive"}</Badge>
              <Badge variant="outline">{TYPE_LABELS[item.notificationType]}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground" dir="ltr">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{item.templateKey}</code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  navigator.clipboard?.writeText(item.templateKey);
                  toast.success("Template key copied.");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            {item.description ? <CardDescription>{item.description}</CardDescription> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onEdit(item)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onDuplicate(item)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(item)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Send className="h-4 w-4 text-[#083f30]" />
              <h3 className="font-semibold">{item.previewTitle || "Untitled notification"}</h3>
            </div>
            <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {item.previewBody || "No body text configured yet."}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {item.defaultChannels.map((channel) => (
                <ChannelBadge key={channel} channel={channel} />
              ))}
            </div>
            <div className="text-xs text-muted-foreground">Updated {formatDate(item.updatedAt)}</div>
          </div>
        </div>

        {item.variables.length ? (
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            {item.variables.map((variable) => (
              <Badge key={variable} variant="outline" dir="ltr">
                {`{{${variable}}}`}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function NotificationTemplateAdmin({ data }: { data: AdminNotificationTemplatesPageData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<TemplateDraft | null>(null);

  const saveAction = useAction(saveNotificationTemplateAction, {
    startTransition,
    onSuccess: () => {
      toast.success("Notification template saved.");
      setDraft(null);
      router.refresh();
    },
    onError: (error) => toast.error(error.detail || error.title || "Could not save notification template."),
  });

  const deleteAction = useAction(deleteNotificationTemplateAction, {
    startTransition,
    onSuccess: () => {
      toast.success("Notification template deleted.");
      router.refresh();
    },
    onError: (error) => toast.error(error.detail || error.title || "Could not delete notification template."),
  });

  const visibleItems = useMemo(() => data.items, [data.items]);

  const onSave = () => {
    if (!draft) return;
    saveAction.execute(draft);
  };

  const onDelete = (item: AdminNotificationTemplate) => {
    if (!window.confirm(`Delete notification template "${item.name}"? Existing notification history will stay untouched.`)) {
      return;
    }
    deleteAction.execute({ id: item.id });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification templates</h1>
          <p className="text-muted-foreground">
            Edit message formats for in-app, email, SMS, and push notifications without changing code.
          </p>
        </div>
        <Button onClick={() => setDraft(emptyDraft())} disabled={data.tableMissing}>
          <Plus className="mr-2 h-4 w-4" />
          New template
        </Button>
      </div>

      {data.tableMissing ? <MissingTableWarning /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard title="Total" value={data.stats.totalCount} hint="All templates" />
        <MetricCard title="Active" value={data.stats.activeCount} hint="Usable by senders" />
        <MetricCard title="Inactive" value={data.stats.inactiveCount} hint="Disabled" />
        <MetricCard title="Booking" value={data.stats.bookingCount} />
        <MetricCard title="Offer" value={data.stats.offerCount} />
        <MetricCard title="System" value={data.stats.systemCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            Showing {data.pagination.currentStartIndex}-{data.pagination.currentEndIndex} of {data.pagination.totalCount}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateToolbar tableMissing={data.tableMissing} />
        </CardContent>
      </Card>

      {draft ? (
        <TemplateEditor
          draft={draft}
          onChange={setDraft}
          onCancel={() => setDraft(null)}
          onSave={onSave}
          isPending={isPending}
        />
      ) : null}

      <div className="space-y-4">
        {visibleItems.length ? (
          visibleItems.map((item) => (
            <TemplateCard
              key={item.id}
              item={item}
              onEdit={(template) => setDraft(cloneDraft(template))}
              onDuplicate={(template) => setDraft(duplicateDraft(template))}
              onDelete={onDelete}
            />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No notification templates found.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function NotificationTemplateAdminSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-72 rounded-lg bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-28 rounded-xl bg-muted" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-52 rounded-xl bg-muted" />
      ))}
    </div>
  );
}
