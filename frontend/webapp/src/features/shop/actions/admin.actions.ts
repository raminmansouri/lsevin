"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { SHOP_PERMISSIONS, assertShopPermission } from "../lib/permissions";
import { setShopPricingMode } from "../lib/pricing";
import { shopId } from "../schemas/id";
import {
  advanceOrderStatus,
  adjustInventory,
  markOrderPaidManually,
  markShipmentDelivered,
  recordShipment,
  reviewOrder,
  setProductPublished,
} from "../server/admin-order.service";
import {
  removeProductServiceLink,
  setProductServiceLink,
  updateProductCore,
} from "../server/admin-catalog.service";
import { recordManualRefund } from "../server/shop-refund.service";

function rv(orderId?: string) {
  revalidatePath("/admin/shop");
  revalidatePath("/admin/shop/orders");
  if (orderId) revalidatePath(`/admin/shop/orders/${orderId}`);
}

const reviewSchema = z.object({
  orderId: z.string().uuid(),
  decision: z.enum(["accepted", "rejected"]),
  reason: z.string().trim().max(500).optional(),
});
export async function reviewOrderAction(input: unknown) {
  const p = reviewSchema.parse(input);
  await reviewOrder(p);
  rv(p.orderId);
  return { ok: true as const };
}

const advanceSchema = z.object({
  orderId: z.string().uuid(),
  to: z.enum([
    "awaiting_payment",
    "paid",
    "processing",
    "partially_shipped",
    "shipped",
    "completed",
    "cancelled",
    "refunded",
    "returned",
  ]),
  reason: z.string().trim().max(500).optional(),
});
export async function advanceOrderAction(input: unknown) {
  const p = advanceSchema.parse(input);
  await advanceOrderStatus(p);
  rv(p.orderId);
  return { ok: true as const };
}

const markPaidSchema = z.object({ orderId: z.string().uuid(), reference: z.string().trim().max(120).optional() });
export async function markOrderPaidAction(input: unknown) {
  const p = markPaidSchema.parse(input);
  await markOrderPaidManually(p);
  rv(p.orderId);
  return { ok: true as const };
}

const shipmentSchema = z.object({
  orderId: shopId,
  carrier: z.string().trim().max(80).optional(),
  trackingNumber: z.string().trim().max(120).optional(),
  markShipped: z.coerce.boolean().optional(),
  items: z.array(z.object({ orderItemId: shopId, quantity: z.coerce.number().int().min(0) })).optional(),
});
export async function recordShipmentAction(input: unknown) {
  const p = shipmentSchema.parse(input);
  await recordShipment(p);
  rv(p.orderId);
  return { ok: true as const };
}

const deliverSchema = z.object({ orderId: z.string().uuid(), shipmentId: z.string().uuid() });
export async function markDeliveredAction(input: unknown) {
  const p = deliverSchema.parse(input);
  await markShipmentDelivered(p);
  rv(p.orderId);
  return { ok: true as const };
}

const publishSchema = z.object({ productId: z.string().uuid(), published: z.coerce.boolean() });
export async function setProductPublishedAction(input: unknown) {
  const p = publishSchema.parse(input);
  await setProductPublished(p);
  revalidatePath("/admin/shop/products");
  return { ok: true as const };
}

const adjustSchema = z.object({
  inventoryId: z.string().uuid(),
  delta: z.coerce.number().int(),
  reason: z.string().trim().min(2).max(200),
});
export async function adjustInventoryAction(input: unknown) {
  const p = adjustSchema.parse(input);
  await adjustInventory(p);
  revalidatePath("/admin/shop/inventory");
  return { ok: true as const };
}

const pricingModeSchema = z.object({ mode: z.enum(["market_default", "market_default_with_selector"]) });
export async function setPricingModeAction(input: unknown) {
  await assertShopPermission(SHOP_PERMISSIONS.pricingManage);
  const p = pricingModeSchema.parse(input);
  await setShopPricingMode(p.mode);
  revalidatePath("/admin/shop/settings");
  revalidatePath("/n/app/mobile/shop");
  return { ok: true as const };
}

// --- product edit + service links -----------------------------------------

const RELATION = ["general", "recommended_before", "recommended_after", "compatible", "required", "optional_addon"] as const;

const productCoreSchema = z.object({
  productId: shopId,
  status: z.enum(["draft", "active", "archived"]),
  slug: z.string().trim().min(2).max(180),
  basePrice: z.coerce.number().min(0),
  baseCurrency: z.string().trim().min(3).max(15),
  nameTranslations: z.record(z.string(), z.string()).default({}),
  shortDescriptionTranslations: z.record(z.string(), z.string()).default({}),
  primaryCategoryId: shopId.optional().nullable(),
  categoryIds: z.array(shopId).default([]),
  isFeatured: z.coerce.boolean().default(false),
  isBestSeller: z.coerce.boolean().default(false),
  isNewArrival: z.coerce.boolean().default(false),
});
export async function updateProductCoreAction(input: unknown) {
  const p = productCoreSchema.parse(input);
  await updateProductCore(p);
  revalidatePath(`/admin/shop/products/${p.productId}`);
  revalidatePath("/admin/shop/products");
  return { ok: true as const };
}

const linkSchema = z.object({
  productId: shopId,
  serviceDefinitionId: shopId,
  relationType: z.enum(RELATION),
  displayOrder: z.coerce.number().int().min(0).default(0),
});
export async function linkProductServiceAction(input: unknown) {
  const p = linkSchema.parse(input);
  await setProductServiceLink(p);
  revalidatePath(`/admin/shop/products/${p.productId}`);
  return { ok: true as const };
}
export async function unlinkProductServiceAction(input: unknown) {
  const p = z.object({ linkId: shopId, productId: shopId }).parse(input);
  await removeProductServiceLink({ linkId: p.linkId });
  revalidatePath(`/admin/shop/products/${p.productId}`);
  return { ok: true as const };
}

export async function updateProductCoreForm(formData: FormData) {
  const cats = formData.getAll("categoryIds").map(String).filter(Boolean);
  await updateProductCoreAction({
    productId: formData.get("productId"),
    status: formData.get("status"),
    slug: formData.get("slug"),
    basePrice: formData.get("basePrice"),
    baseCurrency: formData.get("baseCurrency"),
    nameTranslations: {
      en: String(formData.get("name_en") || ""),
      fa: String(formData.get("name_fa") || ""),
      ar: String(formData.get("name_ar") || ""),
    },
    shortDescriptionTranslations: {
      en: String(formData.get("desc_en") || ""),
      fa: String(formData.get("desc_fa") || ""),
      ar: String(formData.get("desc_ar") || ""),
    },
    primaryCategoryId: formData.get("primaryCategoryId") || undefined,
    categoryIds: cats,
    isFeatured: formData.get("isFeatured") === "on",
    isBestSeller: formData.get("isBestSeller") === "on",
    isNewArrival: formData.get("isNewArrival") === "on",
  });
}
export async function linkProductServiceForm(formData: FormData) {
  await linkProductServiceAction({
    productId: formData.get("productId"),
    serviceDefinitionId: formData.get("serviceDefinitionId"),
    relationType: formData.get("relationType"),
    displayOrder: formData.get("displayOrder") || 0,
  });
}
export async function unlinkProductServiceForm(formData: FormData) {
  await unlinkProductServiceAction({ linkId: formData.get("linkId"), productId: formData.get("productId") });
}

// --- FormData wrappers so the admin pages can use plain <form action> --------

export async function reviewOrderForm(formData: FormData) {
  await reviewOrderAction({
    orderId: formData.get("orderId"),
    decision: formData.get("decision"),
    reason: formData.get("reason") || undefined,
  });
}
export async function advanceOrderForm(formData: FormData) {
  await advanceOrderAction({
    orderId: formData.get("orderId"),
    to: formData.get("to"),
    reason: formData.get("reason") || undefined,
  });
}
export async function markOrderPaidForm(formData: FormData) {
  await markOrderPaidAction({ orderId: formData.get("orderId"), reference: formData.get("reference") || undefined });
}
export async function recordShipmentForm(formData: FormData) {
  // partial shipment: fields named "qty:<orderItemId>" carry the quantity to ship now
  const items: Array<{ orderItemId: string; quantity: number }> = [];
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("qty:")) {
      const quantity = Number(v);
      if (quantity > 0) items.push({ orderItemId: k.slice(4), quantity });
    }
  }
  await recordShipmentAction({
    orderId: formData.get("orderId"),
    carrier: formData.get("carrier") || undefined,
    trackingNumber: formData.get("trackingNumber") || undefined,
    markShipped: formData.get("markShipped") === "on" || formData.get("markShipped") === "true",
    items: items.length ? items : undefined,
  });
}
export async function markDeliveredForm(formData: FormData) {
  await markDeliveredAction({ orderId: formData.get("orderId"), shipmentId: formData.get("shipmentId") });
}

const refundSchema = z.object({
  orderId: shopId,
  amount: z.coerce.number().positive(),
  reason: z.string().trim().min(2).max(500),
  restock: z.coerce.boolean().default(false),
});
export async function recordRefundAction(input: unknown) {
  const p = refundSchema.parse(input);
  const res = await recordManualRefund(p);
  rv(p.orderId);
  return { ok: true as const, ...res };
}
export async function recordRefundForm(formData: FormData) {
  await recordRefundAction({
    orderId: formData.get("orderId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
    restock: formData.get("restock") === "on",
  });
}
export async function setProductPublishedForm(formData: FormData) {
  await setProductPublishedAction({ productId: formData.get("productId"), published: formData.get("published") });
}
export async function adjustInventoryForm(formData: FormData) {
  await adjustInventoryAction({
    inventoryId: formData.get("inventoryId"),
    delta: formData.get("delta"),
    reason: formData.get("reason"),
  });
}
export async function setPricingModeForm(formData: FormData) {
  await setPricingModeAction({ mode: formData.get("mode") });
}

// Invoicing (SHP-V02-013/014/015) — issue a billing document for an order.
export async function issueInvoiceForm(formData: FormData) {
  const orderId = shopId.parse(formData.get("orderId"));
  const type = z.enum(["proforma", "standard"]).parse(formData.get("type"));
  const { issueOrderInvoice } = await import("../server/invoicing.service");
  await issueOrderInvoice({ orderId, type });
  revalidatePath(`/admin/shop/orders/${orderId}`);
}

// Abandoned-cart recovery (SHP-V03-011) — invoked from the dashboard.
export async function runCartRecoveryForm(formData: FormData) {
  const idleHours = Number(formData.get("idleHours")) || 4;
  const { runCartRecovery } = await import("../server/cart-recovery.service");
  await runCartRecovery({ idleHours });
  revalidatePath("/admin/shop");
}
