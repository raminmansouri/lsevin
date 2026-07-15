'use server';

import { revalidatePath } from 'next/cache';

import { getUserId } from '@/lib/auth/session';

import {
  isValidFavoriteEntityId,
  isValidFavoriteEntityType,
  resolveFavoritesCustomerId,
  setFavoriteState,
  toggleFavoriteState,
} from '../server/favorites.repository';
import type { FavoriteEntityType, FavoriteToggleResult } from '../types';

/**
 * Resolves the session's identity id to the matching customer id (FK target of
 * customer.favorites). Returns { requiresAuth } when there's no session, and
 * { unresolved } when there is a session but no linked customer record yet.
 */
type ResolvedFavoritesCustomer =
  | { customerId: string; requiresAuth: false }
  | { customerId: null; requiresAuth: boolean };

async function getFavoritesCustomerId(): Promise<ResolvedFavoritesCustomer> {
  let userId: string | null = null;
  try {
    userId = (await getUserId()) || null;
  } catch {
    userId = null;
  }

  if (!userId) return { customerId: null, requiresAuth: true };

  const customerId = await resolveFavoritesCustomerId(userId);
  if (!customerId) return { customerId: null, requiresAuth: false };

  return { customerId, requiresAuth: false };
}

function validateFavoriteInput(input: { entityType: FavoriteEntityType; entityId: string }) {
  if (!isValidFavoriteEntityType(input.entityType)) {
    throw new Error('Unsupported favorite type.');
  }

  if (!isValidFavoriteEntityId(input.entityId)) {
    throw new Error('Invalid favorite entity id.');
  }
}

export async function toggleFavoriteAction(input: {
  entityType: FavoriteEntityType;
  entityId: string;
  revalidatePathname?: string | null;
}): Promise<FavoriteToggleResult> {
  try {
    validateFavoriteInput(input);

    const resolved = await getFavoritesCustomerId();
    if (!resolved.customerId) {
      return {
        ok: false,
        isFavorite: false,
        requiresAuth: resolved.requiresAuth,
        message: resolved.requiresAuth
          ? 'Please sign in to save favorites.'
          : 'No customer profile is linked to your account yet.',
      };
    }

    const isFavorite = await toggleFavoriteState({
      customerId: resolved.customerId,
      favoriteType: input.entityType,
      entityId: input.entityId,
    });

    if (input.revalidatePathname) revalidatePath(input.revalidatePathname);

    return { ok: true, isFavorite };
  } catch (error) {
    return {
      ok: false,
      isFavorite: false,
      message: error instanceof Error ? error.message : 'Unable to update favorite.',
    };
  }
}

export async function setFavoriteAction(input: {
  entityType: FavoriteEntityType;
  entityId: string;
  isFavorite: boolean;
  revalidatePathname?: string | null;
}): Promise<FavoriteToggleResult> {
  try {
    validateFavoriteInput(input);

    const resolved = await getFavoritesCustomerId();
    if (!resolved.customerId) {
      return {
        ok: false,
        isFavorite: false,
        requiresAuth: resolved.requiresAuth,
        message: resolved.requiresAuth
          ? 'Please sign in to save favorites.'
          : 'No customer profile is linked to your account yet.',
      };
    }

    const isFavorite = await setFavoriteState({
      customerId: resolved.customerId,
      favoriteType: input.entityType,
      entityId: input.entityId,
      isFavorite: input.isFavorite,
    });

    if (input.revalidatePathname) revalidatePath(input.revalidatePathname);

    return { ok: true, isFavorite };
  } catch (error) {
    return {
      ok: false,
      isFavorite: false,
      message: error instanceof Error ? error.message : 'Unable to update favorite.',
    };
  }
}
