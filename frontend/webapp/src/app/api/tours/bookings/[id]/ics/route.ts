import { NextResponse } from "next/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { currentActor } from "@/features/tours/server/platform/access";
import { getMyTourBooking } from "@/features/tours/server/platform/booking";
import { getTourDetail } from "@/features/tours/server/platform/catalog";
import { httpStatusFor, mapDbError } from "@/features/tours/server/platform/errors";

/** "Add to calendar" (.ics) for the signed-in owner of a booking (C-094). Absolute UTC instants, so any calendar app shows the right local time. */
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await currentActor();
  if (!actor.userId) return NextResponse.json({ ok: false, error: { kind: "authentication", code: "sign_in_required" } }, { status: 401 });
  try {
    const booking = await getMyTourBooking(actor.userId, id);
    const locale = new URL(request.url).searchParams.get("locale") ?? booking.uiLocale ?? "en";
    const detail = await getTourDetail(booking.tour.id, contentLocaleFor(locale), { revealExactLocation: true }).catch(() => null);
    const start = new Date(booking.departure.startsAt);
    const minutes = detail?.facts.durationMinutes ?? (detail ? detail.facts.durationDays * 1440 : 120);
    const end = new Date(start.getTime() + minutes * 60_000);
    const snap = booking.contentSnapshot ?? {};
    const title: string = snap.title?.value ?? detail?.text.title?.value ?? booking.tour.slug;
    const meeting = snap.meeting as { lat: number; lng: number } | null;
    const description = [`Voucher ${booking.voucherCode}`, snap.meetingInstructions?.value ?? ""].filter(Boolean).join("\n");
    const body = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Lsevin//Tours//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${booking.bookingId}@tours.lsevin`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(title)}`,
      `DESCRIPTION:${esc(description)}`,
      meeting ? `GEO:${meeting.lat};${meeting.lng}` : null,
      meeting ? `LOCATION:${esc(`${meeting.lat.toFixed(5)}, ${meeting.lng.toFixed(5)}`)}` : null,
      booking.status === "cancelled" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ]
      .filter((l): l is string => l !== null)
      .join("\r\n");
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="tour-${booking.voucherCode}.ics"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    const err = mapDbError(e, "tours.ics");
    return NextResponse.json({ ok: false, error: { kind: err.kind, code: err.code } }, { status: httpStatusFor[err.kind] });
  }
}
