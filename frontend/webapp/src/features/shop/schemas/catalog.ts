import { shopId } from "./id";
import { z } from "zod";
export const translatedTextSchema = z.record(z.string(), z.string()).default({});
export const uuidSchema = shopId;
export const productSearchSchema = z.object({
  q: z.string().trim().max(120).default(""),
  category: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  sort: z.enum(["popularity", "newest", "price_asc", "price_desc", "rating"]).default("popularity"),
  minPrice: z.coerce.number().min(0).default(0),
  maxPrice: z.coerce.number().min(0).default(0),
  minRating: z.coerce.number().min(0).max(5).default(0),
  inStockOnly: z.coerce.boolean().default(false),
  featuredOnly: z.coerce.boolean().default(false),
  discountedOnly: z.coerce.boolean().default(false),
  slugs: z.array(z.string().trim()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
});
export const addToCartSchema = z.object({ productId: uuidSchema, variantId: uuidSchema.nullish(), quantity: z.coerce.number().int().min(1).max(999) });
export const wishlistToggleSchema = z.object({ productId: uuidSchema, variantId: uuidSchema.nullish() });
export const reviewCreateSchema = z.object({ productId: uuidSchema, orderItemId: uuidSchema.nullish(), rating: z.coerce.number().int().min(1).max(5), title: z.string().trim().max(120).optional(), body: z.string().trim().max(4000).optional() });
