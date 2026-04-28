'use server';

import { revalidatePath } from 'next/cache';

import { getUserId } from '@/lib/auth/session';

import {
  isValidFavoriteEntityId,
  isValidFavoriteEntityType,
  setFavoriteState,
  toggleFavoriteState,
} from '../server/favorites.repository';
import type { FavoriteEntityType, FavoriteToggleResult } from '../types';

async function getOptionalCustomerId() {
  try {
    return (await getUserId()) || null;
  } catch {
    return null;
  }
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

    const customerId = await getOptionalCustomerId();
    if (!customerId) {
      return {
        ok: false,
        isFavorite: false,
        requiresAuth: true,
        message: 'Please sign in to save favorites.',
      };
    }

    const isFavorite = await toggleFavoriteState({
      customerId,
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

    const customerId = await getOptionalCustomerId();
    if (!customerId) {
      return {
        ok: false,
        isFavorite: false,
        requiresAuth: true,
        message: 'Please sign in to save favorites.',
      };
    }

    const isFavorite = await setFavoriteState({
      customerId,
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
