import "server-only";

import fs from "node:fs";
import path from "node:path";

import { pagesForAction } from "./actions";

/**
 * Reads Next's `server-reference-manifest.json` (action id -> the page entries that import it).
 *
 * `next build` writes it under `.next/server/`, and the standalone image keeps it there, relative to
 * the server's working directory. It is re-read at most every {@link REFRESH_MS} (and only when its
 * modification time changed), so a dev server that adds actions as it compiles pages stays accurate.
 */
const REFRESH_MS = 30_000;

type Cache = { checkedAt: number; mtimeMs: number; manifest: unknown };
const globalForCache = globalThis as unknown as { __actionManifest?: Cache };

function manifestPath(): string {
  return path.join(process.cwd(), ".next", "server", "server-reference-manifest.json");
}

function load(): unknown {
  const cached = globalForCache.__actionManifest;
  const now = Date.now();
  if (cached && now - cached.checkedAt < REFRESH_MS) return cached.manifest;

  const file = manifestPath();
  const stat = fs.statSync(file); // throws if the build output is missing
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    cached.checkedAt = now;
    return cached.manifest;
  }
  const manifest = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
  globalForCache.__actionManifest = { checkedAt: now, mtimeMs: stat.mtimeMs, manifest };
  return manifest;
}

export type ActionPagesResult = { ok: true; pages: string[] | null } | { ok: false };

/**
 * The pages that import `actionId`: `ok: true, pages: null` when the id is not in the manifest, and
 * `ok: false` when the manifest itself cannot be read. A caller must treat `ok: false` as "cannot
 * decide" (503), never as permission.
 */
export function actionPages(actionId: string): ActionPagesResult {
  try {
    return { ok: true, pages: pagesForAction(load(), actionId) };
  } catch (error) {
    console.error("[admin-access] cannot read the server-reference manifest", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { ok: false };
  }
}
