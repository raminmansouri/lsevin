"use client";

import { useEffect } from "react";

import { trackShopViewAction } from "../actions/product-personal.actions";

/**
 * Fires a commerce view event once on mount. Lets a cookie-free (ISR) page keep
 * its analytics without pulling `getShopContext()` into the render path.
 */
export function ShopViewTracker({
  categoryId,
  productId,
  surface,
}: {
  categoryId?: string;
  productId?: string;
  surface: string;
}) {
  useEffect(() => {
    void trackShopViewAction({ categoryId, productId, surface });
  }, [categoryId, productId, surface]);

  return null;
}
