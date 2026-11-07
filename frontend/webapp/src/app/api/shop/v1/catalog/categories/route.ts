import { NextResponse } from "next/server";

import { listCategories } from "@/features/shop-api/server/repository";
import { shopApiRoute } from "@/features/shop-api/server/route";

/** Shop categories, for a product's categoryIds / primaryCategoryId. */
export const GET = shopApiRoute("catalog:read", async () => NextResponse.json(await listCategories()));
