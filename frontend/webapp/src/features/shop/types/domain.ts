export type UUID = string;
export type OrderStatus =
  | "pending" | "awaiting_payment" | "paid" | "processing" | "partially_shipped"
  | "shipped" | "completed" | "cancelled" | "refunded" | "partially_refunded" | "returned";
export type PaymentStatus = "pending" | "authorized" | "captured" | "failed" | "voided" | "partially_refunded" | "refunded";
export type ShipmentStatus = "pending" | "ready" | "packed" | "shipped" | "delivered" | "failed" | "returned";

export interface ShopCategory {
  id: UUID;
  parentId: UUID | null;
  name: string;
  slug: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  icon: string | null;
  gradient: string | null;
  productCount: number;
}

export interface ProductCard {
  id: UUID;
  slug: string;
  name: string;
  shortDescription: string;
  imageUrl: string | null;
  brandName: string | null;
  categoryName: string | null;
  currency: string;
  minPrice: number;
  maxPrice: number;
  compareAtPrice: number | null;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  hasDiscount: boolean;
  hasStock: boolean;
  wishlistActive: boolean;
}

export interface ProductDetail extends ProductCard {
  description: string;
  gallery: Array<{ id: UUID; url: string; mediaType: string; alt: string; isPrimary: boolean }>;
  categories: ShopCategory[];
  attributes: Array<{ attributeId: UUID; name: string; values: Array<{ id: UUID; value: string; displayName: string }> }>;
  variants: Array<{
    id: UUID; sku: string; slug: string; title: string; optionKey: string; price: number;
    compareAtPrice: number | null; hasStock: boolean; inventoryAvailable: number; selections: Record<string, string>;
  }>;
  reviews: Array<{ id: UUID; rating: number; title: string | null; body: string | null; createDate: string; customerName: string | null; isVerifiedPurchase: boolean; }>;
  relatedProducts: ProductCard[];
}

export interface CartItem {
  id: UUID; productId: UUID; variantId: UUID | null; slug: string; name: string; imageUrl: string | null;
  attributes: Record<string, string>; quantity: number; unitPrice: number; compareAtPrice: number | null; currency: string;
  hasStock: boolean; inventoryAvailable: number; savedForLater: boolean;
}

export interface CartTotals { subtotal: number; discountTotal: number; shippingTotal: number; taxTotal: number; grandTotal: number; currency: string; couponCode: string | null; }
export interface CartView { id: UUID; items: CartItem[]; totals: CartTotals; itemCount: number; }
export interface OrderSummary { id: UUID; orderNumber: string; status: OrderStatus; paymentStatus: PaymentStatus; fulfillmentStatus: ShipmentStatus; placedAt: string; grandTotal: number; currency: string; itemCount: number; }
export interface OrderDetail extends OrderSummary {
  items: Array<{ id: UUID; productId: UUID | null; slug: string | null; name: string; variantName: string | null; imageUrl: string | null; quantity: number; unitPrice: number; lineTotal: number; attributes: Record<string, string>; }>;
  shippingAddress: Record<string, string | null>;
  billingAddress: Record<string, string | null>;
  statusHistory: Array<{ id: UUID; fromStatus: OrderStatus | null; toStatus: OrderStatus; note: string | null; createDate: string }>;
  shipments: Array<{ id: UUID; shipmentNumber: string; trackingNumber: string | null; carrier: string | null; status: ShipmentStatus }>;
}
