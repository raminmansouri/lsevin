// @/config/env/server.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export const env = createEnv({
  server: {
    INTERNAL_API_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(1),
    WEBHOOK_KEY: z.string().min(1),
    PROVIDER_PORTAL_ORIGIN: z.string().url().optional(),
    PROVIDER_PORTAL_SSO_SECRET: z.string().min(32).optional(),
    // BTCPay Server (crypto gateway for non-Iranian customers). Optional so the
    // app still boots with crypto switched off; the provider raises a specific
    // error if the gateway is enabled while these are unset.
    BTCPAY_SERVER_URL: z.string().url().optional(),
    BTCPAY_STORE_ID: z.string().min(1).optional(),
    BTCPAY_API_KEY: z.string().min(1).optional(),
    BTCPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
    BTCPAY_INVOICE_CURRENCY: z.string().min(3).max(3).optional(),
    BTCPAY_INVOICE_EXPIRATION_MINUTES: z.coerce.number().int().positive().max(1440).optional(),
    // MeliPayamak, for the free-consultation notifications. Optional so the app
    // still boots without them — the dispatcher records "skipped: no_credentials"
    // against the request rather than failing the customer's submission. The same
    // account backs OTP from the .NET Identity module
    // (src/API/LSevin.Api/appsettings.json → MeliPayamakClientOptions).
    MELIPAYAMAK_USERNAME: z.string().min(1).optional(),
    MELIPAYAMAK_PASSWORD: z.string().min(1).optional(),
    MELIPAYAMAK_BASE_URL: z.string().url().optional(),
  },
  experimental__runtimeEnv: {
    INTERNAL_API_URL: process.env.INTERNAL_API_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    WEBHOOK_KEY: process.env.WEBHOOK_KEY,
    PROVIDER_PORTAL_ORIGIN: process.env.PROVIDER_PORTAL_ORIGIN,
    PROVIDER_PORTAL_SSO_SECRET: process.env.PROVIDER_PORTAL_SSO_SECRET,
    BTCPAY_SERVER_URL: process.env.BTCPAY_SERVER_URL,
    BTCPAY_STORE_ID: process.env.BTCPAY_STORE_ID,
    BTCPAY_API_KEY: process.env.BTCPAY_API_KEY,
    BTCPAY_WEBHOOK_SECRET: process.env.BTCPAY_WEBHOOK_SECRET,
    BTCPAY_INVOICE_CURRENCY: process.env.BTCPAY_INVOICE_CURRENCY,
    BTCPAY_INVOICE_EXPIRATION_MINUTES: process.env.BTCPAY_INVOICE_EXPIRATION_MINUTES,
    MELIPAYAMAK_USERNAME: process.env.MELIPAYAMAK_USERNAME,
    MELIPAYAMAK_PASSWORD: process.env.MELIPAYAMAK_PASSWORD,
    MELIPAYAMAK_BASE_URL: process.env.MELIPAYAMAK_BASE_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.NODE_ENV === "test",
});