import { requireCurrentUser } from "@core/auth/session";
import { requireStaffProfilePermission } from "@core/auth/permissions";
import { isPrivateFileUrl, openPrivateFileUrl } from "@core/storage/privateFiles";
import type { ModuleApiProps } from "@core/modules/types";
import { portalLocaleHeader } from "@core/i18n/config";
import { getBookingDocument, searchBookingResourceOptions, searchBookingStaffOptions, searchProviderBookingOptions, searchStaffBookingOptions } from "./repository";

function safeFileName(value: string) {
  return String(value || "booking-document").replace(/[\r\n"\\/]/g, "_").slice(0, 180) || "booking-document";
}

function documentResponseHeaders(document: { fileName: string; mimeType: string | null }, sizeBytes?: number) {
  const fileName = safeFileName(document.fileName);
  const headers = new Headers({
    "Content-Type": document.mimeType || "application/octet-stream",
    "Content-Disposition": `inline; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
  });
  if (typeof sizeBytes === "number" && Number.isFinite(sizeBytes)) headers.set("Content-Length", String(sizeBytes));
  return headers;
}

async function serveDocument(request: Request, document: Awaited<ReturnType<typeof getBookingDocument>>) {
  if (!document) return Response.json({ error: "Booking document was not found or is not available in this workspace." }, { status: 404 });

  const url = String(document.fileUrl || "").trim();
  if (/^https?:\/\//i.test(url)) return Response.redirect(url, 302);
  if (url.startsWith("/")) return Response.redirect(new URL(url, request.url), 302);
  if (!isPrivateFileUrl(url)) {
    return Response.json({ error: "This document uses a storage reference that is not supported by the protected file bridge." }, { status: 409 });
  }

  try {
    const opened = await openPrivateFileUrl(url);
    return new Response(opened.stream, { status: 200, headers: documentResponseHeaders(document, opened.sizeBytes) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Private booking document could not be opened.";
    const notFound = /ENOENT|not identify a regular file/i.test(message);
    return Response.json({ error: notFound ? "Booking document file was not found." : message }, { status: notFound ? 404 : 409 });
  }
}

export async function handleProviderBookingDocument({ request, params }: ModuleApiProps) {
  const document = await getBookingDocument({ providerId: params.providerId, documentId: params.documentId });
  return serveDocument(request, document);
}

export async function handleStaffBookingDocument({ request, params }: ModuleApiProps) {
  const user = await requireCurrentUser();
  const claim = await requireStaffProfilePermission(user.id, params.staffId, "viewOwnBookings");
  if (!claim.serviceProviderId) return Response.json({ error: "Active provider scope is required." }, { status: 403 });
  const document = await getBookingDocument({
    providerId: claim.serviceProviderId,
    staffId: params.staffId,
    documentId: params.documentId,
  });
  return serveDocument(request, document);
}


function optionInput(request: Request) {
  const url = new URL(request.url);
  return {
    query: url.searchParams.get("q") || "",
    selected: url.searchParams.get("selected") || "",
    locale: portalLocaleHeader(url.searchParams.get("locale")),
    limit: Number(url.searchParams.get("limit") || 30),
  };
}

export async function handleProviderBookingOptions({ request, params }: ModuleApiProps) {
  const url = new URL(request.url);
  const kind = params.kind;
  const common = optionInput(request);
  if (kind === "booking") return Response.json({ items: await searchProviderBookingOptions({ providerId: params.providerId, ...common }) });
  if (kind === "staff") return Response.json({ items: await searchBookingStaffOptions({ providerId: params.providerId, ...common }) });
  if (kind === "resource") return Response.json({ items: await searchBookingResourceOptions({ providerId: params.providerId, ...common }) });
  return Response.json({ error: `Unsupported booking option kind: ${url.pathname}` }, { status: 400 });
}

export async function handleStaffBookingOptions({ request, params }: ModuleApiProps) {
  const user = await requireCurrentUser();
  const claim = await requireStaffProfilePermission(user.id, params.staffId, "viewOwnBookings");
  if (!claim.serviceProviderId) return Response.json({ error: "Active provider scope is required." }, { status: 403 });
  return Response.json({ items: await searchStaffBookingOptions({ providerId: claim.serviceProviderId, staffId: params.staffId, ...optionInput(request) }) });
}
