"use client";

import { getFavoriteKeysAction } from "../actions/favorite-actions";
import type { FavoriteEntityType } from "../types";

/**
 * Collects the favourite status requests of every heart on the page and asks the
 * server once (static pages cannot know the visitor's favourites at build time).
 */
const known = new Map<string, boolean>();
const waiters = new Map<string, Set<(value: boolean) => void>>();
let pending = new Map<string, { entityType: FavoriteEntityType; entityId: string }>();
let timer: ReturnType<typeof setTimeout> | null = null;

const keyOf = (entityType: FavoriteEntityType, entityId: string) => `${entityType}:${entityId.toLowerCase()}`;

async function flush() {
  const batch = [...pending.entries()];
  pending = new Map();
  timer = null;
  if (!batch.length) return;

  let favourites = new Set<string>();
  try {
    favourites = new Set(await getFavoriteKeysAction(batch.map(([, item]) => item)));
  } catch {
    // Leave every heart as it was.
  }

  for (const [key] of batch) {
    const value = favourites.has(key);
    known.set(key, value);
    waiters.get(key)?.forEach((callback) => callback(value));
    waiters.delete(key);
  }
}

/** Calls back with the item's favourite status; returns an unsubscribe function. */
export function requestFavoriteStatus(
  entityType: FavoriteEntityType,
  entityId: string,
  callback: (value: boolean) => void
): () => void {
  const key = keyOf(entityType, entityId);
  const cached = known.get(key);
  if (cached !== undefined) {
    callback(cached);
    return () => undefined;
  }

  if (!waiters.has(key)) waiters.set(key, new Set());
  waiters.get(key)!.add(callback);
  pending.set(key, { entityType, entityId });
  if (!timer) timer = setTimeout(flush, 60);

  return () => waiters.get(key)?.delete(callback);
}

/** Keeps the cache in step after the visitor toggles a heart. */
export function rememberFavoriteStatus(entityType: FavoriteEntityType, entityId: string, value: boolean) {
  known.set(keyOf(entityType, entityId), value);
}