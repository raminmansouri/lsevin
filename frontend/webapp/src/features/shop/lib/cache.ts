import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

/** Shared by catalog mutations so image, price and visibility changes reach shoppers. */
export function revalidateShopCatalog() {
  for (const tag of ["shop-product", "shop-home", "shop-categories"])
    revalidateTag(tag);
  revalidatePath("/[locale]/admin/shop/products", "page");
  revalidatePath("/[locale]/admin/shop/products/[id]", "page");
  revalidatePath("/[locale]/n/app/mobile/shop", "layout");
}
