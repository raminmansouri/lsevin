/**
 * Booking draft persisted per tour in sessionStorage (C-089, AT-31): survives a
 * refresh, a sign-in round trip and a language switch (same tab), and is never
 * put into the URL because it holds personal data. Cleared after confirmation.
 */
import type { TravelerClass } from "../../../domain/pricing";

export type DraftParticipant = {
  travelerClass: TravelerClass;
  firstName: string;
  lastName: string;
  nationality: string;
  age: string;
  isForeign: boolean;
  assistanceRequest: string;
};

export type DraftBuyer = { firstName: string; lastName: string; email: string; phone: string };

export type BookingStep = "date" | "travelers" | "details" | "review" | "result";

export type BookingDraft = {
  v: 1;
  step: BookingStep;
  departureId: string | null;
  optionId: string | null;
  travelers: Partial<Record<TravelerClass, number>>;
  addons: Record<string, number>;
  buyer: DraftBuyer;
  participants: DraftParticipant[];
  hold: { id: string; key: string; expiresAt: string; total: number; policyVersion: number; confirmationMode: "instant" | "request"; selectionKey: string } | null;
  confirmKey: string | null;
  accepted: number | null;
  result: { bookingId: string; status: string; voucherCode: string; amountDue: number; currency: string; paymentDeadlineAt: string | null; requestExpiresAt: string | null } | null;
  savedAt: number;
};

const KEY = (tourId: string) => `lsevin_tours_draft:${tourId}`;
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

export function emptyBuyer(): DraftBuyer {
  return { firstName: "", lastName: "", email: "", phone: "" };
}

export function readDraft(tourId: string): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY(tourId));
    if (!raw) return null;
    const d = JSON.parse(raw) as BookingDraft;
    if (d?.v !== 1 || Date.now() - (d.savedAt ?? 0) > MAX_AGE_MS) return null;
    return d;
  } catch {
    return null;
  }
}

export function writeDraft(tourId: string, draft: BookingDraft) {
  try {
    sessionStorage.setItem(KEY(tourId), JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // storage unavailable: the flow still works, it just cannot be restored
  }
}

export function clearDraft(tourId: string) {
  try {
    sessionStorage.removeItem(KEY(tourId));
  } catch {
    // ignore
  }
}

/** Idempotency keys must match ^[A-Za-z0-9_-]{16,80}$ (booking.ts). */
export function newKey(prefix: string): string {
  const raw = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${prefix}_${raw.replace(/[^A-Za-z0-9]/g, "")}`.slice(0, 64);
}

export function selectionKey(s: { departureId: string | null; optionId: string | null; travelers: Record<string, number | undefined>; addons: Record<string, number> }) {
  const tr = Object.entries(s.travelers).filter(([, n]) => n).sort().map(([k, n]) => `${k}${n}`).join(",");
  const ad = Object.entries(s.addons).filter(([, n]) => n).sort().map(([k, n]) => `${k}${n}`).join(",");
  return `${s.departureId}|${s.optionId}|${tr}|${ad}`;
}

/** ISO 3166-1 alpha-2 codes for the nationality picker (names come from Intl.DisplayNames). */
export const COUNTRY_CODES = (
  "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG KP MK NO OM PK PW PS PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW"
).split(" ");

/** Persian / Arabic-Indic digits → ASCII, for phone numbers typed with a local keyboard (S-067). */
export function toAscii(value: string): string {
  return String(value ?? "").replace(/[۰-۹٠-٩]/g, (d) => {
    const c = d.charCodeAt(0);
    return String(c - (c >= 0x06f0 ? 0x06f0 : 0x0660));
  });
}
