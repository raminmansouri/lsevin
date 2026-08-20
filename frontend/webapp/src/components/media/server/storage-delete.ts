import { deleteData } from "@/config/http/http-service.server";

/**
 * Deletes the stored object behind a media row, through the API's admin-only
 * `File/DeleteAnyFile` endpoint.
 *
 * The web app deliberately holds no credentials for the object store: the API owns writes
 * and deletes, so there is exactly one component that can remove bytes and one place where
 * the rules about which paths may be removed live. This is only the client for it.
 *
 * The endpoint reports an already-absent object as success, so retrying after a partial
 * failure is safe.
 */
export type StorageDeleteOutcome = {
  path: string;
  /** True when a stored object was actually removed. */
  deleted: boolean;
  /** True when this path is not something the API will delete, so it was not attempted. */
  skipped: boolean;
  error?: string;
};

/**
 * The prefixes the API's delete endpoint accepts.
 *
 * Duplicated from the server rule on purpose. The server is the authority — it rejects
 * anything else with a 400 — but knowing the rule here lets a legacy row whose path the API
 * will never accept be reported as skipped instead of retried forever, so such a row can
 * still be removed from the library.
 */
const DELETABLE_PREFIXES = ["Categories/", "ServiceProviders/"];

function toRelativePath(fileUrl: string): string | null {
  const trimmed = String(fileUrl || "").trim();
  if (!trimmed) return null;

  // Rows predating the object-storage migration may hold an absolute URL, a leading slash,
  // or a Windows-era backslash. The endpoint wants the plain relative path.
  const withoutBase = trimmed.replace(/^https?:\/\/[^/]+/i, "");
  const normalized = withoutBase.replace(/\\/g, "/").replace(/^\/+/, "");

  return normalized || null;
}

export async function deleteStoredObject(
  fileUrl: string | null | undefined,
  token: string | undefined
): Promise<StorageDeleteOutcome> {
  const path = toRelativePath(fileUrl ?? "");

  if (!path) {
    return { path: "", deleted: false, skipped: true, error: "The media row has no usable path." };
  }

  if (!DELETABLE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    // Legacy shapes such as `uploads/bug-reports/...` live outside the media namespace the
    // API will delete under. Skipping rather than erroring keeps the row deletable.
    return {
      path,
      deleted: false,
      skipped: true,
      error: `Path is outside the media namespace; the stored object was left in place.`,
    };
  }

  const { data, error } = await deleteData<undefined, boolean>(
    `File/DeleteAnyFile?path=${encodeURIComponent(path)}`,
    undefined,
    { locale: "en", token }
  );

  if (error) {
    return {
      path,
      deleted: false,
      skipped: false,
      error: typeof error === "string" ? error : "The storage delete failed.",
    };
  }

  // `false` means the object was already gone, which still satisfies the request.
  return { path, deleted: data === true, skipped: false };
}

export async function deleteStoredObjects(
  fileUrls: Array<string | null | undefined>,
  token: string | undefined
): Promise<StorageDeleteOutcome[]> {
  return Promise.all(fileUrls.map((fileUrl) => deleteStoredObject(fileUrl, token)));
}
