"use client";

import { create } from "zustand";
import type { LazyOption, LazyOptionsResult } from "./location-select.types";

type QueryCacheEntry = LazyOptionsResult & {
  updatedAt: number;
};

type State = {
  itemCache: Record<string, LazyOption>;
  queryCache: Record<string, QueryCacheEntry>;
  getItem: (key: string) => LazyOption | undefined;
  setItem: (key: string, item: LazyOption) => void;
  setItems: (prefix: string, items: LazyOption[]) => void;
  getQuery: (key: string, ttlMs?: number) => LazyOptionsResult | null;
  setQuery: (key: string, value: LazyOptionsResult) => void;
  clearPrefix: (prefix: string) => void;
};

export const useLocationSelectStore = create<State>((set, get) => ({
  itemCache: {},
  queryCache: {},

  getItem: (key) => get().itemCache[key],

  setItem: (key, item) =>
    set((state) => ({
      itemCache: {
        ...state.itemCache,
        [key]: item,
      },
    })),

  setItems: (prefix, items) =>
    set((state) => {
      const next = { ...state.itemCache };
      for (const item of items) {
        next[`${prefix}|item|${item.value}`] = item;
      }
      return { itemCache: next };
    }),

  getQuery: (key, ttlMs = 60_000) => {
    const entry = get().queryCache[key];
    if (!entry) return null;
    if (Date.now() - entry.updatedAt > ttlMs) return null;
    return {
      items: entry.items,
      hasMore: entry.hasMore,
    };
  },

  setQuery: (key, value) =>
    set((state) => ({
      queryCache: {
        ...state.queryCache,
        [key]: {
          ...value,
          updatedAt: Date.now(),
        },
      },
    })),

  clearPrefix: (prefix) =>
    set((state) => {
      const itemCache = Object.fromEntries(
        Object.entries(state.itemCache).filter(([key]) => !key.startsWith(prefix))
      );
      const queryCache = Object.fromEntries(
        Object.entries(state.queryCache).filter(([key]) => !key.startsWith(prefix))
      );
      return { itemCache, queryCache };
    }),
}));