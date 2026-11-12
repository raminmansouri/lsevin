import "server-only";

import sql from "@/config/database/db";
import {
  createNotificationFromTemplate,
  type NotificationChannel,
} from "@/app/[locale]/n/app/mobile/notifications/notification-service";

import { encodePatternVariables, maskPhone, readMeliPayamakCredentials, sendPatternSms } from "@/features/consultation/server/melipayamak";
import { notifyClinicsOfPaidOrder } from "@/features/shop-api/server/portal-orders";

import { formatShopMoney } from "../components/money";
import { pickupSmsRecipient, pickupSmsVariables, SHOP_PICKUP_READY_PATTERN_ENV } from "../lib/pickup-sms";

/**
 * Shop order notifications (SHP-V01-023). Mirrors
 * `@/features/notification/server/booking-notifications` — same `notify.*`
 * infrastructure, templates seeded idempotently, every send wrapped so a
 * notification failure never breaks the order flow. In-app requires a resolved
 * identity user, so guest orders currently get email only where an address is
 * known; a signed-in customer gets in-app + email + SMS/WhatsApp/push per
 * eligibility.
 */

export type ShopOrderEvent =
  | "order.placed"
  | "order.paid"
  | "order.payment_failed"
  | "order.shipped"
  | "order.delivered"
  | "order.cancelled"
  | "order.refunded";

async function notifyTablesExist(): Promise<boolean> {
  const [row] = await sql<{ exists: boolean }[]>`select to_regclass('notify.notifications') is not null as exists`;
  return Boolean(row?.exists);
}

let templatesEnsured = false;
async function ensureTemplates(): Promise<void> {
  if (templatesEnsured) return;
  const tr = (fa: string, en: string, ar: string) => sql.json({ fa, en, ar, "fa-IR": fa, "en-US": en });

  const templates = [
    {
      key: "shop.order.placed.customer",
      name: "Shop order placed (customer)",
      channels: ["in_app", "email"] as NotificationChannel[],
      title: tr("سفارش شما ثبت شد", "Your order is placed", "تم تقديم طلبك"),
      body: tr(
        "سفارش شماره {{orderNumber}} به مبلغ {{amountFormatted}} ثبت شد و در انتظار پرداخت است.",
        "Order {{orderNumber}} for {{amountFormatted}} has been placed and is awaiting payment.",
        "تم تقديم الطلب {{orderNumber}} بقيمة {{amountFormatted}} وهو بانتظار الدفع."
      ),
    },
    {
      key: "shop.order.paid.customer",
      name: "Shop order paid (customer)",
      channels: ["in_app", "email"] as NotificationChannel[],
      title: tr("پرداخت سفارش تأیید شد", "Payment received", "تم استلام الدفع"),
      body: tr(
        "پرداخت سفارش {{orderNumber}} با موفقیت انجام شد. سفارش شما در حال آماده‌سازی است.",
        "Payment for order {{orderNumber}} succeeded. Your order is now being prepared.",
        "نجحت عملية الدفع للطلب {{orderNumber}}. جارٍ تجهيز طلبك."
      ),
    },
    {
      key: "shop.order.payment_failed.customer",
      name: "Shop order payment failed (customer)",
      channels: ["in_app", "email"] as NotificationChannel[],
      title: tr("پرداخت سفارش ناموفق بود", "Payment did not go through", "لم تتم عملية الدفع"),
      body: tr(
        "پرداخت سفارش {{orderNumber}} انجام نشد. می‌توانید دوباره تلاش کنید.",
        "Payment for order {{orderNumber}} failed. You can try again from your orders.",
        "فشلت عملية الدفع للطلب {{orderNumber}}. يمكنك المحاولة مرة أخرى."
      ),
    },
    {
      key: "shop.order.shipped.customer",
      name: "Shop order shipped (customer)",
      channels: ["in_app", "email", "sms"] as NotificationChannel[],
      title: tr("سفارش شما ارسال شد", "Your order has shipped", "تم شحن طلبك"),
      body: tr(
        "سفارش {{orderNumber}} ارسال شد. کد رهگیری: {{trackingNumber}} ({{carrier}}).",
        "Order {{orderNumber}} has shipped. Tracking: {{trackingNumber}} ({{carrier}}).",
        "تم شحن الطلب {{orderNumber}}. التتبع: {{trackingNumber}} ({{carrier}})."
      ),
    },
    {
      key: "shop.order.delivered.customer",
      name: "Shop order delivered (customer)",
      channels: ["in_app", "email"] as NotificationChannel[],
      title: tr("سفارش شما تحویل داده شد", "Your order was delivered", "تم تسليم طلبك"),
      body: tr(
        "سفارش {{orderNumber}} تحویل داده شد. از خرید شما سپاسگزاریم.",
        "Order {{orderNumber}} was delivered. Thank you for shopping with LSevin.",
        "تم تسليم الطلب {{orderNumber}}. شكراً لتسوقك مع ال‑سيفين."
      ),
    },
    {
      key: "shop.order.cancelled.customer",
      name: "Shop order cancelled (customer)",
      channels: ["in_app", "email"] as NotificationChannel[],
      title: tr("سفارش شما لغو شد", "Your order was cancelled", "تم إلغاء طلبك"),
      body: tr(
        "سفارش {{orderNumber}} لغو شد. {{reason}}",
        "Order {{orderNumber}} has been cancelled. {{reason}}",
        "تم إلغاء الطلب {{orderNumber}}. {{reason}}"
      ),
    },
    {
      key: "shop.order.refunded.customer",
      name: "Shop order refunded (customer)",
      channels: ["in_app", "email"] as NotificationChannel[],
      title: tr("مبلغ سفارش شما بازپرداخت شد", "Your order was refunded", "تم استرداد مبلغ طلبك"),
      body: tr(
        "بازپرداخت سفارش {{orderNumber}} انجام شد. {{reason}}",
        "A refund for order {{orderNumber}} has been processed. {{reason}}",
        "تمت معالجة استرداد للطلب {{orderNumber}}. {{reason}}"
      ),
    },
  ];

  templates.push({
    // In-app + email copy of the pickup SMS (the SMS itself goes through a MeliPayamak pattern).
    key: "shop.order.ready_for_pickup.customer",
    name: "Shop order ready for pickup at the Lsevin office (customer)",
    channels: ["in_app", "email"] as NotificationChannel[],
    title: tr("سفارش شما در دفتر لسوین آماده تحویل است", "Your order is ready at the Lsevin office", "طلبك جاهز في مكتب لسوين"),
    body: tr(
      "سفارش {{orderNumber}} در دفتر لسوین آماده تحویل است. کد تحویل: {{pickupCode}}. نشانی: {{officeAddress}}",
      "Order {{orderNumber}} is ready for pickup at the Lsevin office. Pickup code: {{pickupCode}}. Address: {{officeAddress}}",
      "الطلب {{orderNumber}} جاهز للاستلام في مكتب لسوين. رمز الاستلام: {{pickupCode}}. العنوان: {{officeAddress}}"
    ),
  });

  templates.push({
    key: "shop.cart.abandoned.customer",
    name: "Shop cart abandoned (customer)",
    channels: ["in_app", "email"] as NotificationChannel[],
    title: tr("سبد خرید شما منتظر شماست", "Your cart is waiting", "سلة التسوق بانتظارك"),
    body: tr(
      "شما {{itemCount}} کالا در سبد خرید خود دارید. برای تکمیل خرید بازگردید.",
      "You have {{itemCount}} item(s) waiting in your cart. Come back to complete your purchase.",
      "لديك {{itemCount}} عنصر بانتظارك في السلة. عد لإتمام الشراء."
    ),
  });

  for (const tmpl of templates) {
    await sql`
      insert into notify.notification_templates (template_key, name, notification_type, default_channels, title_translations, body_translations)
      values (${tmpl.key}, ${tmpl.name}, 'shop', ${tmpl.channels}, ${tmpl.title}, ${tmpl.body})
      on conflict (template_key) do update set
        title_translations = excluded.title_translations,
        body_translations = excluded.body_translations,
        default_channels = excluded.default_channels
    `;
  }
  templatesEnsured = true;
}

function eligibleChannels(email: string | null, phone: string | null): NotificationChannel[] {
  const c: NotificationChannel[] = ["in_app"];
  if (email) c.push("email");
  if (phone) {
    c.push("sms");
    c.push("whatsapp");
  }
  c.push("push");
  return Array.from(new Set(c));
}

type OrderNotifyRow = {
  orderNumber: string;
  customerId: string | null;
  email: string | null;
  currency: string;
  grandTotal: number;
  identityUserId: string | null;
  phone: string | null;
  locale: string | null;
};

async function loadOrder(orderId: string): Promise<OrderNotifyRow | null> {
  const rows = await sql<any[]>`
    select
      o.order_number as "orderNumber", o.customer_id::text as "customerId", o.email,
      o.currency, o.grand_total::float as "grandTotal",
      u.id::text as "identityUserId",
      nullif(concat_ws('', u.phone_number_country_code, u.phone_number), '') as phone,
      null::text as locale
    from shop.orders o
    left join customer.customers c on c.id = o.customer_id
    left join identity.asp_net_users u
      on (nullif(c.email,'') is not null and lower(u.email) = lower(c.email))
      or (nullif(c.phone_number,'') is not null and u.phone_number = c.phone_number and u.phone_number_country_code = c.phone_number_country_code)
    where o.id = ${orderId}::uuid
    limit 1
  `;
  return rows[0] ?? null;
}

/**
 * Fires after the relevant transaction commits. Never throws — the caller's flow
 * must not depend on a notification succeeding.
 */
export async function notifyShopOrderEvent(input: {
  orderId: string;
  event: ShopOrderEvent;
  locale?: string | null;
  extra?: Record<string, string>;
}): Promise<void> {
  // The clinics that sell in a paid order hear about it in the provider portal (never throws).
  if (input.event === "order.paid") await notifyClinicsOfPaidOrder(input.orderId);
  try {
    if (!(await notifyTablesExist())) return;
    const order = await loadOrder(input.orderId);
    if (!order) return;
    // in-app needs an identity user; skip cleanly for an unresolvable guest order
    if (!order.identityUserId && !order.email) return;

    await ensureTemplates();

    const variables: Record<string, string> = {
      orderNumber: order.orderNumber,
      amountFormatted: formatShopMoney(Number(order.grandTotal), order.currency, (input.locale || "fa").split("-")[0]),
      trackingNumber: input.extra?.trackingNumber || "-",
      carrier: input.extra?.carrier || "-",
      reason: input.extra?.reason || "",
    };

    if (!order.identityUserId) return; // createNotificationFromTemplate needs a resolved user

    await createNotificationFromTemplate({
      templateKey: `shop.${input.event}.customer`,
      locale: input.locale ?? order.locale,
      customerId: order.identityUserId,
      entityType: "shop_order",
      entityId: input.orderId,
      channels: eligibleChannels(order.email, order.phone),
      emailTo: order.email,
      phoneTo: order.phone,
      variables,
      fallbackTitle: "LSevin Shop",
      fallbackBody: `Order ${order.orderNumber}`,
    });
  } catch (error) {
    console.error(`notifyShopOrderEvent(${input.event}) failed`, error);
  }
}

/**
 * Abandoned-cart nudge (SHP-V03-011). Best-effort, never throws. Only a customer
 * with a resolvable identity user is messaged; returns whether a notification
 * was actually created so the caller can record delivery state.
 */
export async function notifyCartAbandoned(input: {
  cartId: string;
  customerId: string | null;
  recoveryToken?: string | null;
  itemCount: number;
  currency?: string;
}): Promise<boolean> {
  try {
    if (!input.customerId) return false;
    if (!(await notifyTablesExist())) return false;

    const [u] = await sql<
      { identityUserId: string | null; email: string | null; phone: string | null }[]
    >`
      select u.id::text as "identityUserId",
        nullif(u.email, '') as email,
        nullif(concat_ws('', u.phone_number_country_code, u.phone_number), '') as phone
      from customer.customers c
      join identity.asp_net_users u
        on (nullif(c.email, '') is not null and lower(u.email) = lower(c.email))
        or (nullif(c.phone_number, '') is not null and u.phone_number = c.phone_number
            and u.phone_number_country_code = c.phone_number_country_code)
      where c.id = ${input.customerId}::uuid
      limit 1
    `;
    if (!u?.identityUserId) return false;

    await ensureTemplates();
    await createNotificationFromTemplate({
      templateKey: "shop.cart.abandoned.customer",
      locale: "fa",
      customerId: u.identityUserId,
      entityType: "shop_cart",
      entityId: input.cartId,
      channels: eligibleChannels(u.email, u.phone),
      emailTo: u.email,
      phoneTo: u.phone,
      variables: { itemCount: String(input.itemCount) },
      fallbackTitle: "LSevin Shop",
      fallbackBody: "You left items in your cart",
    });
    return true;
  } catch (error) {
    console.error("notifyCartAbandoned failed", error);
    return false;
  }
}

// ------------------------------------------------------------------------------------------------
// Pickup at the Lsevin office: "your order is ready, here is the code"
// ------------------------------------------------------------------------------------------------

type OfficePickupNotifyRow = {
  orderNumber: string;
  email: string | null;
  identityUserId: string | null;
  identityPhone: string | null;
  addressPhone: string | null;
  addressCountry: string | null;
  officeAddress: string | null;
};

/**
 * Tells the customer that the order is ready at the Lsevin office, with the pickup code: an SMS
 * through the approved MeliPayamak pattern, plus in-app/email when the customer has an account.
 * Called after "ready" is committed. Never throws. Each newly issued code is sent again.
 */
export async function notifyShopOfficePickupReady(input: { orderId: string; code: string }): Promise<void> {
  try {
    const [row] = await sql<OfficePickupNotifyRow[]>`
      select o.order_number as "orderNumber", nullif(o.email, '') as email,
        u.id::text as "identityUserId",
        nullif(concat_ws('', u.phone_number_country_code, u.phone_number), '') as "identityPhone",
        nullif(concat_ws('', a.phone_number_country_code, a.phone_number), '') as "addressPhone",
        nullif(a.country, '') as "addressCountry",
        nullif(common.get_translation_t(dm.pickup_address_translations, 'fa', 'en'), '') as "officeAddress"
      from shop.orders o
      left join shop.delivery_methods dm on dm.id = o.delivery_method_id
      left join customer.customers c on c.id = o.customer_id
      left join identity.asp_net_users u
        on (nullif(c.email,'') is not null and lower(u.email) = lower(c.email))
        or (nullif(c.phone_number,'') is not null and u.phone_number = c.phone_number and u.phone_number_country_code = c.phone_number_country_code)
      left join lateral (
        select ad.phone_number_country_code, ad.phone_number, ad.country from shop.order_addresses ad
        where ad.order_id = o.id and nullif(ad.phone_number, '') is not null
        order by (ad.address_type = 'shipping') desc limit 1
      ) a on true
      where o.id = ${input.orderId}::uuid
      limit 1
    `;
    if (!row) return;

    // 1) SMS (pattern). The mobile entered at checkout comes first: it is the one asked for pickup.
    const phone = pickupSmsRecipient([
      { phone: row.addressPhone, country: row.addressCountry },
      { phone: row.identityPhone, country: "IR" },
    ]);
    const bodyId = process.env[SHOP_PICKUP_READY_PATTERN_ENV]?.trim();
    const credentials = readMeliPayamakCredentials();
    let smsSent = false;
    if (!phone) {
      console.warn("[shop] pickup SMS skipped: no Iranian mobile on the order", { orderId: input.orderId });
    } else if (!bodyId || !credentials) {
      console.warn("[shop] pickup SMS skipped: SMS pattern or credentials not configured", {
        orderId: input.orderId,
        pattern: Boolean(bodyId),
        credentials: Boolean(credentials),
      });
    } else {
      const result = await sendPatternSms({
        to: phone,
        bodyId,
        variables: encodePatternVariables(pickupSmsVariables(row.orderNumber, input.code)),
        credentials,
      });
      smsSent = result.ok;
      if (!result.ok) {
        console.error("[shop] pickup SMS failed", { orderId: input.orderId, to: maskPhone(phone), error: result.error });
      }
    }
    if (smsSent) {
      await sql`update shop.order_office_pickups set customer_notified_at = now() where order_id = ${input.orderId}::uuid`;
    }

    // 2) In-app + email, for a customer with an account (same rule as the other order events).
    if (row.identityUserId && (await notifyTablesExist())) {
      await ensureTemplates();
      await createNotificationFromTemplate({
        templateKey: "shop.order.ready_for_pickup.customer",
        locale: null,
        customerId: row.identityUserId,
        entityType: "shop_order",
        entityId: input.orderId,
        channels: row.email ? ["in_app", "email"] : ["in_app"],
        emailTo: row.email,
        phoneTo: null,
        variables: { orderNumber: row.orderNumber, pickupCode: input.code, officeAddress: row.officeAddress || "-" },
        fallbackTitle: "LSevin Shop",
        fallbackBody: `Order ${row.orderNumber} is ready for pickup at the Lsevin office.`,
      });
    }
  } catch (error) {
    console.error("[shop] notifyShopOfficePickupReady failed", { orderId: input.orderId, error: (error as Error)?.message });
  }
}
