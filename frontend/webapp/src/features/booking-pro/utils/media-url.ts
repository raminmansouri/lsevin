const ABSOLUTE_URL_RE = /^(https?:|data:|blob:)/i;
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function trimSlashes(value: string) {
  return value.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function resolveStoredMediaUrl(value?: string | null): string | undefined {
  const raw = String(value || "").trim();
  if (!raw) return undefined;

  // Target forms should persist resolved URLs/paths, not media_library ids.
  // If old/broken data still contains only a UUID, do not fabricate a URL from it.
  if (UUID_RE.test(raw)) return undefined;

  if (ABSOLUTE_URL_RE.test(raw) || raw.startsWith("/")) return raw;

  const filesBase = process.env.NEXT_PUBLIC_FILES_URL || process.env.NEXT_PUBLIC_API_URL || "";
  if (!filesBase) return raw;

  return `${trimSlashes(filesBase)}/${trimSlashes(raw)}`;
}
