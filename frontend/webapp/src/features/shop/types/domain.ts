export type UUID = string;

/** Server-resolved money: `amount` in `currency` is what the customer sees/pays. */
export interface MoneyView {
  amount: number;
  currency: string;
  sourceAmount: number;
  sourceCurrency: string;
  appliedRate: number;
  converted: boolean;
  unavailable: boolean;
}

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
  /** resolved display currency for this request */
  currency: string;
  /** resolved display price (from cheapest variant / base) */
  price: number;
  priceMax: number;
  compareAtPrice: number | null;
  priceUnavailable: boolean;
  /** exact stored commercial value, for admin/debug + "≈" hint */
  sourceCurrency: string;
  sourcePrice: number;
  discountPercent: number | null;
  rating: number;
  reviewCount: number;
  soldCount: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  hasDiscount: boolean;
  sellerCount?: number;
  hasStock: boolean;
  isPreorder: boolean;
  wishlistActive: boolean;
}

export interface ProductVariantView {
  id: UUID;
  sku: string;
  slug: string;
  title: string;
  optionKey: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  priceUnavailable: boolean;
  hasStock: boolean;
  inventoryAvailable: number;
  allowBackorder: boolean;
  selections: Record<string, string>;
}


export interface ProductOfferView {
  id: UUID;
  variantId: UUID | null;
  sellerId: UUID;
  sellerSlug: string;
  sellerName: string;
  sellerLogoUrl: string | null;
  isDefaultSeller: boolean;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  priceUnavailable: boolean;
  inStock: boolean;
  handlingDays: number | null;
  warranty: string;
  /** Sold by a partner seller (e.g. a clinic) who hands the item to Lsevin; Lsevin sends it. */
  partnerSeller?: boolean;
}

export interface ProductDetail extends ProductCard {
  description: string;
  requiresShipping: boolean;
  fulfillmentType: "delivery" | "pickup" | "download";
  allowBackorder: boolean;
  inventoryAvailable: number;
  preorderConfigured: boolean;
  preorderReleaseAt: string | null;
  preorderPaymentPolicy: "full" | "deposit" | "proforma";
  preorderDepositPercent: number | null;
  preorderRemaining: number | null;
  gallery: Array<{ id: UUID; url: string; mediaType: string; alt: string; isPrimary: boolean }>;
  categories: ShopCategory[];
  attributes: Array<{ attributeId: UUID; name: string; slug: string; values: Array<{ id: UUID; value: string; displayName: string; colorHex: string | null }> }>;
  variants: ProductVariantView[];
  relatedServices: Array<{ serviceDefinitionId: UUID; name: string; relationType: string }>;
  questions: Array<{ id: UUID; question: string; answer: string | null; createDate: string }>;
  reviews: Array<{ id: UUID; rating: number; title: string | null; body: string | null; createDate: string; customerName: string | null; isVerifiedPurchase: boolean; }>;
  relatedProducts: ProductCard[];
  /** Live offers, every seller and variant; the page picks the winner per selected variant. */
  offers: ProductOfferView[];
  /** Lsevin's fastest delivery to an address, in days (null = not configured). */
  lsevinDeliveryDays?: number | null;
}

export interface CartItem {
  id: UUID; productId: UUID; variantId: UUID | null; slug: string; name: string; variantTitle: string | null; imageUrl: string | null;
  /** The seller this line buys from (null for lines added before the marketplace). */
  sellerName?: string | null;
  /** Who sells it. A partner seller (e.g. a clinic) hands the item to Lsevin, which sends it. */
  sellerId?: string | null;
  partnerSeller?: boolean;
  /** The offer's handling time (days until it is at Lsevin); null = not set. */
  handlingDays?: number | null;
  attributes: Record<string, string>; quantity: number;
  /** resolved display unit price + line total in `currency` */
  unitPrice: number; lineTotal: number; compareAtPrice: number | null; currency: string;
  priceUnavailable: boolean;
  sourceCurrency: string; sourceUnitPrice: number;
  hasStock: boolean; inventoryAvailable: number; maxPurchasable: number; savedForLater: boolean;
}

export interface CartTotals {
  subtotal: number; discountTotal: number; shippingTotal: number; taxTotal: number; grandTotal: number;
  currency: string; couponCode: string | null;
  /** true if any line's price could not be resolved */
  hasUnavailablePrice: boolean;
}
export interface CartView {
  id: UUID; items: CartItem[]; totals: CartTotals; itemCount: number;
  currency: string; pricingMode: "market_default" | "market_default_with_selector";
  selectableCurrencies: Array<{ code: string; symbol: string; name: string }>;
  /** null = no coupon; "applied" | "free_shipping" | an invalid-reason code */
  couponMessage: string | null;
}

export interface OrderSummary {
  id: UUID; orderNumber: string; status: OrderStatus; paymentStatus: PaymentStatus; fulfillmentStatus: ShipmentStatus;
  reviewStatus: "not_required" | "pending" | "accepted" | "rejected";
  placedAt: string; grandTotal: number; currency: string; itemCount: number;
}
export type OfficePickupStatus = "preparing" | "ready" | "picked_up" | "cancelled";
/** An order collected at the Lsevin office. */
export interface OrderOfficePickup {
  status: OfficePickupStatus;
  readyAt: string | null;
  pickedUpAt: string | null;
  /** Only while ready: the code the customer tells the office. */
  pickupCode: string | null;
  office: { address: string | null; phone: string | null; hours: string | null } | null;
}
export interface OrderDetail extends OrderSummary {
  email: string;
  subtotal: number; discountTotal: number; shippingTotal: number; taxTotal: number;
  paymentCurrency: string | null; paymentTotal: number | null;
  couponCode: string | null;
  items: Array<{ id: UUID; productId: UUID | null; slug: string | null; name: string; variantName: string | null; imageUrl: string | null; quantity: number; unitPrice: number; lineTotal: number; attributes: Record<string, string>; fulfillmentStatus: ShipmentStatus;
    /** Who sold the line (Lsevin sends every line). */
    sellerId?: UUID | null; sellerName?: string | null; }>;
  /** The overall estimate shown at checkout and kept on the order (null for older orders). */
  promisedDays?: number | null; promisedReadyAt?: string | null;
  /** Delivery to the address (default, and every older order) or pickup at the Lsevin office. */
  fulfillmentMode?: "delivery" | "office_pickup";
  /** Set for office pickup orders. */
  officePickup?: OrderOfficePickup | null;
  shippingAddress: Record<string, string | null>;
  billingAddress: Record<string, string | null>;
  payments: Array<{ id: UUID; provider: string | null; amount: number; currency: string; status: string; createdAt: string }>;
  statusHistory: Array<{ id: UUID; fromStatus: OrderStatus | null; toStatus: OrderStatus; note: string | null; createDate: string }>;
  shipments: Array<{ id: UUID; shipmentNumber: string; trackingNumber: string | null; carrier: string | null; status: ShipmentStatus; shippedAt: string | null; deliveredAt: string | null }>;
  returns: Array<{ id: UUID; status: string; reason: string; requestedAt: string; reviewNote: string | null; items: Array<{ name: string; quantity: number }> }>;
  fxSnapshot: Record<string, unknown>;
}
