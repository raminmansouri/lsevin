"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import { archivePatientNoteAction, addPatientNoteAction } from "../../server/actions";
import type {
  AccountPatientLinkRow,
  PatientAddressRow,
  PatientContactRow,
  PatientIdentifierRow,
  PatientNoteRow,
  PatientRow,
  PatientTimelineEventRow,
} from "../../types";
import { PATIENTS_TRANSLATION_KEY } from "../../types";
import {
  AddContactDialog,
  AddIdentifierDialog,
  AddAddressDialog,
  LinkAccountDialog,
} from "./patient-quick-add-dialogs";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function PatientDashboard({
  patient,
  identifiers,
  contacts,
  addresses,
  accountLinks,
  timeline,
  notes,
  canSeeSuperadminNotes,
}: {
  patient: PatientRow;
  identifiers: PatientIdentifierRow[];
  contacts: PatientContactRow[];
  addresses: PatientAddressRow[];
  accountLinks: AccountPatientLinkRow[];
  timeline: PatientTimelineEventRow[];
  notes: PatientNoteRow[];
  canSeeSuperadminNotes: boolean;
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);

  const age = patient.birthDate
    ? Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                {patient.firstName} {patient.lastName}
              </h2>
              <Badge variant={patient.status === "active" ? "outline" : "secondary"}>
                {t(`admin.status.${patient.status}`)}
              </Badge>
            </div>
            <p dir="ltr" className="text-muted-foreground text-sm">
              {patient.publicId}
            </p>
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
            {age !== null && (
              <span>
                {t("admin.fields.age")}: {age}
              </span>
            )}
            {patient.nationalityCountryCode && (
              <span dir="ltr">
                {t("admin.fields.nationality")}: {patient.nationalityCountryCode}
              </span>
            )}
            {patient.primaryLanguage && (
              <span>
                {t("admin.fields.primaryLanguage")}: {patient.primaryLanguage}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">{t("admin.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="timeline">{t("admin.tabs.timeline")}</TabsTrigger>
          <TabsTrigger value="notes">{t("admin.tabs.notes")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <OverviewTab
            patient={patient}
            identifiers={identifiers}
            contacts={contacts}
            addresses={addresses}
            accountLinks={accountLinks}
          />
        </TabsContent>

        <TabsContent value="timeline" className="pt-4">
          <TimelineTab patientId={patient.id} initialEvents={timeline} />
        </TabsContent>

        <TabsContent value="notes" className="pt-4">
          <NotesTab patientId={patient.id} notes={notes} canSeeSuperadminNotes={canSeeSuperadminNotes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({
  patient,
  identifiers,
  contacts,
  addresses,
  accountLinks,
}: {
  patient: PatientRow;
  identifiers: PatientIdentifierRow[];
  contacts: PatientContactRow[];
  addresses: PatientAddressRow[];
  accountLinks: AccountPatientLinkRow[];
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [addIdentifierOpen, setAddIdentifierOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [linkAccountOpen, setLinkAccountOpen] = useState(false);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("admin.overview.identifiers")}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setAddIdentifierOpen(true)}>
            {t("admin.overview.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {identifiers.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {identifiers.map((identifier) => (
            <div key={identifier.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{t(`admin.identifierTypes.${identifier.identifierType}`)}</p>
                <p dir="ltr" className="text-muted-foreground text-sm">
                  {identifier.maskedValue}
                </p>
              </div>
              <div className="flex gap-1">
                {identifier.isPrimary && <Badge variant="outline">{t("admin.overview.primary")}</Badge>}
                <Badge variant={identifier.isVerified ? "default" : "secondary"}>
                  {identifier.isVerified ? t("admin.overview.verified") : t("admin.overview.unverified")}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("admin.overview.contacts")}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setAddContactOpen(true)}>
            {t("admin.overview.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {contacts.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{t(`admin.contactTypes.${contact.contactType}`)}</p>
                <p dir="ltr" className="text-muted-foreground text-sm">
                  {contact.value}
                </p>
              </div>
              {contact.isPrimary && <Badge variant="outline">{t("admin.overview.primary")}</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("admin.overview.addresses")}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setAddAddressOpen(true)}>
            {t("admin.overview.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {addresses.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {addresses.map((address) => (
            <div key={address.id} className="border-b pb-2 text-sm last:border-0 last:pb-0">
              <p>{[address.addressLine1, address.city, address.countryCode].filter(Boolean).join(", ") || "-"}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("admin.overview.accounts")}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setLinkAccountOpen(true)}>
            {t("admin.overview.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {accountLinks.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {accountLinks.map((link) => (
            <div key={link.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
              <p dir="ltr" className="text-muted-foreground text-sm">
                {link.accountId}
              </p>
              <Badge variant="outline">{t(`admin.relationshipTypes.${link.relationshipType}`)}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <AddIdentifierDialog patientId={patient.id} open={addIdentifierOpen} onOpenChange={setAddIdentifierOpen} />
      <AddContactDialog patientId={patient.id} open={addContactOpen} onOpenChange={setAddContactOpen} />
      <AddAddressDialog patientId={patient.id} open={addAddressOpen} onOpenChange={setAddAddressOpen} />
      <LinkAccountDialog patientId={patient.id} open={linkAccountOpen} onOpenChange={setLinkAccountOpen} />
    </div>
  );
}

const TIMELINE_EVENT_TYPES = [
  "patient_created",
  "patient_updated",
  "identifier_added",
  "account_linked",
  "contact_added",
  "address_added",
  "note_added",
] as const;

function TimelineTab({ patientId, initialEvents }: { patientId: string; initialEvents: PatientTimelineEventRow[] }) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [events, setEvents] = useState(initialEvents);
  const [eventType, setEventType] = useState<string>("all");
  const [order, setOrder] = useState<"newest_first" | "oldest_first">("newest_first");

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">{t("admin.tabs.timeline")}</CardTitle>
        <div className="flex gap-2">
          <Select
            value={eventType}
            onValueChange={(value) => {
              setEventType(value);
              const filtered = value === "all" ? initialEvents : initialEvents.filter((event) => event.action === value);
              setEvents(order === "oldest_first" ? [...filtered].reverse() : filtered);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("admin.timeline.allEvents")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.timeline.allEvents")}</SelectItem>
              {TIMELINE_EVENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`admin.timeline.events.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const nextOrder = order === "newest_first" ? "oldest_first" : "newest_first";
              setOrder(nextOrder);
              setEvents((prev) => [...prev].reverse());
            }}
          >
            {order === "newest_first" ? t("admin.timeline.newestFirst") : t("admin.timeline.oldestFirst")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 && <p className="text-muted-foreground py-6 text-center text-sm">{t("admin.timeline.empty")}</p>}
        <ol className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex items-start justify-between gap-2 border-b pb-3 last:border-0">
              <span className="text-sm">{t(`admin.timeline.events.${event.action}`)}</span>
              <span dir="ltr" className="text-muted-foreground shrink-0 text-xs">
                {formatDateTime(event.occurredAt)}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function NotesTab({
  patientId,
  notes,
  canSeeSuperadminNotes,
}: {
  patientId: string;
  notes: PatientNoteRow[];
  canSeeSuperadminNotes: boolean;
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"admin" | "superadmin">("admin");
  const [isPending, startTransition] = useTransition();

  const addNote = () => {
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await addPatientNoteAction({ patientId, body: body.trim(), visibility });
      if (result.ok) {
        toast.success(t("admin.notes.saved"));
        setBody("");
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  const archive = (noteId: string) => {
    startTransition(async () => {
      const result = await archivePatientNoteAction({ noteId });
      if (result.ok) {
        toast.success(t("admin.notes.archived"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("admin.tabs.notes")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t("admin.notes.placeholder")}
            rows={3}
          />
          <div className="flex items-center justify-between gap-2">
            {canSeeSuperadminNotes && (
              <Select value={visibility} onValueChange={(value) => setVisibility(value as "admin" | "superadmin")}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t("admin.notes.visibilityAdmin")}</SelectItem>
                  <SelectItem value="superadmin">{t("admin.notes.visibilitySuperadmin")}</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button type="button" size="sm" onClick={addNote} disabled={isPending || !body.trim()}>
              {t("admin.notes.add")}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {notes.length === 0 && <p className="text-muted-foreground py-6 text-center text-sm">{t("admin.notes.empty")}</p>}
          {notes.map((note) => (
            <div key={note.id} className="space-y-1 border-b pb-3 last:border-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm whitespace-pre-wrap">{note.body}</p>
                <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => archive(note.id)}>
                  {t("admin.notes.archive")}
                </Button>
              </div>
              <div className="text-muted-foreground flex gap-2 text-xs">
                <span dir="ltr">{formatDate(note.createdAt)}</span>
                {note.visibility === "superadmin" && <Badge variant="outline">{t("admin.notes.visibilitySuperadmin")}</Badge>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
