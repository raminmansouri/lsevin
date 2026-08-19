import path from "node:path";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@core/auth/session";
import { requireProviderPermission } from "@core/auth/permissions";
import { normalizePortalLocale, PORTAL_LOCALE_COOKIE, portalLocaleHeader } from "@core/i18n/config";
import { buildLsevinSsoUrl, createPortalSession, PORTAL_SESSION_COOKIE, safeReturnTo, verifyLsevinSsoAssertion } from "@core/auth/sso";
import { isLocalDevAuthEnabled, requireLocalDevLoginUser } from "@core/auth/localDevAuth";
import { listReferenceOptions } from "@core/reference-data/repository";
import type { ReferenceType } from "@core/reference-data/types";
import { createOwnedMedia, getAccessibleMediaByReferences, listAccessibleMedia } from "@core/media/repository";
import { verifyFileSignature } from "@core/storage/fileSignatures";

const referenceTypes = new Set<ReferenceType>(["currency", "country", "city"]);
const MAX_BYTES = Number(process.env.PROVIDER_MEDIA_MAX_BYTES || 25 * 1024 * 1024);
const BLOCKED_UPLOAD_EXTENSIONS = new Set([".html", ".htm", ".js", ".mjs", ".svg", ".xml", ".php"]);
const BLOCKED_UPLOAD_MIME_TYPES = new Set(["text/html", "text/javascript", "application/javascript", "image/svg+xml", "application/xml", "text/xml"]);

function cleanExtension(name: string) {
  const extension = path.extname(name).replace(/[^a-zA-Z0-9.]/g, "").toLowerCase();
  return extension.length <= 12 ? extension : "";
}

export async function handleCoreApi(request: Request, method: string, modulePath: string[]) {
  const pathKey = modulePath.join("/");

  if (method === "GET" && pathKey === "auth/start") {
    const url = new URL(request.url);
    const returnTo = safeReturnTo(url.searchParams.get("returnTo"));
    if (isLocalDevAuthEnabled()) {
      return NextResponse.redirect(new URL(`/login?returnTo=${encodeURIComponent(returnTo)}`, url.origin));
    }
    const locale = normalizePortalLocale(url.searchParams.get("locale"));
    const ssoUrl = buildLsevinSsoUrl(returnTo, locale.locale);
    if (!ssoUrl) return NextResponse.redirect(new URL("/?auth=required", url.origin));
    return NextResponse.redirect(new URL(ssoUrl));
  }

  if (method === "POST" && pathKey === "auth/local/login") {
    if (!isLocalDevAuthEnabled()) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const formData = await request.formData();
    const userId = String(formData.get("userId") || "").trim();
    const returnTo = safeReturnTo(String(formData.get("returnTo") || "/dashboard"));
    const localUser = await requireLocalDevLoginUser(userId);
    if (!localUser) return NextResponse.json({ error: "Active local LSevin user not found." }, { status: 400 });

    const session = createPortalSession(localUser.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin;
    const response = NextResponse.redirect(new URL(returnTo, appUrl), 303);
    response.cookies.set(PORTAL_SESSION_COOKIE, session.token, { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: session.maxAge });
    return response;
  }

  if (method === "POST" && pathKey === "auth/local/logout") {
    if (!isLocalDevAuthEnabled()) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const formData = await request.formData();
    const returnTo = safeReturnTo(String(formData.get("returnTo") || "/login"));
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin;
    const response = NextResponse.redirect(new URL(returnTo, appUrl), 303);
    response.cookies.set(PORTAL_SESSION_COOKIE, "", { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 0 });
    return response;
  }

  if (method === "GET" && pathKey === "auth/sso/callback") {
    const url = new URL(request.url);
    const assertion = url.searchParams.get("assertion") || "";
    const returnTo = safeReturnTo(url.searchParams.get("returnTo"));
    try {
      const verified = verifyLsevinSsoAssertion(assertion);
      const locale = normalizePortalLocale(verified.locale);
      const session = createPortalSession(verified.userId, locale.locale);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || url.origin;
      const response = NextResponse.redirect(new URL(returnTo, appUrl));
      const secure = process.env.NODE_ENV === "production";
      const sessionDomain = process.env.PROVIDER_PORTAL_COOKIE_DOMAIN?.trim() || undefined;
      const localeDomain = process.env.NEXT_PUBLIC_LOCALE_COOKIE_DOMAIN?.trim() || sessionDomain;
      response.cookies.set(PORTAL_SESSION_COOKIE, session.token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: session.maxAge, domain: sessionDomain });
      response.cookies.set(PORTAL_LOCALE_COOKIE, locale.locale, { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: 31_536_000, domain: localeDomain });
      return response;
    } catch {
      return NextResponse.redirect(new URL("/?auth=sso-invalid", process.env.NEXT_PUBLIC_APP_URL?.trim() || url.origin));
    }
  }

  if (method === "GET" && pathKey === "reference-data") {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const url = new URL(request.url);
    const type = url.searchParams.get("type") as ReferenceType;
    if (!referenceTypes.has(type)) return NextResponse.json({ error: "Unsupported reference type." }, { status: 400 });
    const items = await listReferenceOptions({
      type,
      query: url.searchParams.get("q") || "",
      locale: portalLocaleHeader(url.searchParams.get("locale")),
      parentCode: url.searchParams.get("parentCode") || "",
      selected: url.searchParams.get("selected") || "",
      limit: Number(url.searchParams.get("limit") || 40),
    });
    return NextResponse.json({ items });
  }

  if (method === "GET" && pathKey === "core/media") {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const url = new URL(request.url);
    const providerId = url.searchParams.get("providerId") || "";
    if (!providerId) return NextResponse.json({ error: "providerId is required." }, { status: 400 });
    await requireProviderPermission(user.id, providerId, "view");
    const items = await listAccessibleMedia({ userId: user.id, providerId, query: url.searchParams.get("q") || "", mediaType: url.searchParams.get("mediaType") || "" });
    return NextResponse.json({ items });
  }

  if (method === "POST" && pathKey === "core/media/by-references") {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const body = await request.json() as { providerId?: string; references?: string[] };
    const providerId = String(body.providerId || "");
    if (!providerId) return NextResponse.json({ error: "providerId is required." }, { status: 400 });
    await requireProviderPermission(user.id, providerId, "view");
    const items = await getAccessibleMediaByReferences({ userId: user.id, providerId, references: Array.isArray(body.references) ? body.references : [] });
    return NextResponse.json({ items });
  }

  if (method === "POST" && pathKey === "core/media/upload") {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const formData = await request.formData();
    const file = formData.get("file");
    const providerId = String(formData.get("providerId") || "");
    if (!(file instanceof File) || !providerId) return NextResponse.json({ error: "File and providerId are required." }, { status: 400 });
    const providerRole = await requireProviderPermission(user.id, providerId, "manageMedia");
    if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: `File size must be between 1 byte and ${MAX_BYTES} bytes.` }, { status: 400 });

    if (file.name.length > 255) return NextResponse.json({ error: "File name must be 255 characters or fewer." }, { status: 400 });
    const extension = cleanExtension(file.name);
    const mimeType = (file.type || "application/octet-stream").toLowerCase();
    if (BLOCKED_UPLOAD_EXTENSIONS.has(extension) || BLOCKED_UPLOAD_MIME_TYPES.has(mimeType)) {
      return NextResponse.json({ error: "This active-content file type is not allowed in provider media." }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    let verified;
    try {
      verified = verifyFileSignature(bytes, mimeType);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "File signature validation failed." }, { status: 400 });
    }
    const declaredExtension = extension.replace(/^\./, "");
    if (declaredExtension && declaredExtension !== "jpeg" && declaredExtension !== verified.extension) {
      return NextResponse.json({ error: `The file extension does not match the uploaded ${verified.mimeType} content.` }, { status: 400 });
    }
    const storedName = `${randomUUID()}.${verified.extension}`;
    const relativeDir = path.posix.join("uploads", "provider-media", providerId, user.id);
    const publicRoot = process.env.PROVIDER_MEDIA_STORAGE_ROOT || path.join(process.cwd(), "public");
    const directory = path.join(publicRoot, ...relativeDir.split("/"));
    await fs.mkdir(directory, { recursive: true });
    const fullPath = path.join(directory, storedName);
    await fs.writeFile(fullPath, bytes, { flag: "wx", mode: 0o640 });
    const baseUrl = (process.env.PROVIDER_MEDIA_PUBLIC_BASE_URL || "").replace(/\/$/, "");
    const fileUrl = baseUrl ? `${baseUrl}/${relativeDir}/${storedName}` : `/${relativeDir}/${storedName}`;
    const ownershipRole = providerRole === "owner" || providerRole === "admin" || providerRole === "manager" || providerRole === "editor" ? providerRole : "editor";
    try {
      const id = await createOwnedMedia({ providerId, userId: user.id, originalName: file.name, storedName, fileUrl, storagePath: fullPath, storageKey: `${relativeDir}/${storedName}`, mimeType: verified.mimeType, extension: verified.extension, mediaType: verified.mediaType, fileSize: file.size, ownershipRole });
      const items = await getAccessibleMediaByReferences({ userId: user.id, providerId, references: [id] });
      return NextResponse.json(items[0], { status: 201 });
    } catch (error) {
      await fs.unlink(fullPath).catch(() => undefined);
      throw error;
    }
  }

  return null;
}
