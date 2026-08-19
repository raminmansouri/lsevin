import "server-only";

const REQUIRED_PRODUCTION_ENV = [
  "NEXT_PUBLIC_APP_URL",
  "LSEVIN_SSO_URL",
  "PROVIDER_PORTAL_SSO_SECRET",
  "PROVIDER_PORTAL_SESSION_SECRET",
  "PRIVATE_FILE_STORAGE_ROOT",
] as const;

export const PAYMENT_GATEWAY_REQUIREMENTS = {
  zarinpal: [
    "ZARINPAL_MERCHANT_ID",
    "ZARINPAL_REQUEST_URL",
    "ZARINPAL_VERIFY_URL",
    "ZARINPAL_STARTPAY_BASE_URL",
    "ZARINPAL_CALLBACK_URL",
  ],
  idpay: [
    "IDPAY_API_KEY",
    "IDPAY_CREATE_URL",
    "IDPAY_VERIFY_URL",
    "IDPAY_CALLBACK_URL",
  ],
} as const;

export type PaymentGatewayCode = keyof typeof PAYMENT_GATEWAY_REQUIREMENTS;

function isPlaceholder(value: string) {
  const normalized = value.trim();
  return normalized === "" || /replace-with|change[-_]?me|<[^>]+>|example\.(?:com|invalid)/i.test(normalized);
}

export function enabledPaymentGateways(): PaymentGatewayCode[] {
  const configured = (process.env.PAYMENT_GATEWAYS_ENABLED || "none")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value && value !== "none");
  return [...new Set(configured.filter((value): value is PaymentGatewayCode => value in PAYMENT_GATEWAY_REQUIREMENTS))];
}

export function isPaymentGatewayEnabled(code: string): code is PaymentGatewayCode {
  return enabledPaymentGateways().includes(code as PaymentGatewayCode);
}

export type ProductionReadiness = {
  ready: boolean;
  missing: string[];
  errors: string[];
  enabledPaymentGateways: PaymentGatewayCode[];
};

export function getProductionReadiness(): ProductionReadiness {
  if (process.env.NODE_ENV !== "production") {
    return { ready: true, missing: [], errors: [], enabledPaymentGateways: enabledPaymentGateways() };
  }

  const enabledGateways = enabledPaymentGateways();
  const required = [
    ...REQUIRED_PRODUCTION_ENV,
    ...enabledGateways.flatMap((gateway) => PAYMENT_GATEWAY_REQUIREMENTS[gateway]),
  ];
  const missing: string[] = [...new Set(required.filter((key) => !process.env[key] || isPlaceholder(process.env[key] || "")))];
  const databaseUrl = process.env.DATABASE_URL?.trim() || "";
  const splitDatabaseKeys = ["PGHOST", "PGDATABASE", "PGUSER", "PGPASSWORD"] as const;
  const splitDatabaseReady = splitDatabaseKeys.every((key) => Boolean(process.env[key]?.trim()));
  if (!databaseUrl && !splitDatabaseReady) {
    missing.push("DATABASE_URL or PGHOST/PGDATABASE/PGUSER/PGPASSWORD");
  }
  const configuredGatewayTokens = (process.env.PAYMENT_GATEWAYS_ENABLED || "none")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value && value !== "none");
  const invalidGateways = configuredGatewayTokens.filter((value) => !(value in PAYMENT_GATEWAY_REQUIREMENTS));
  const errors: string[] = [];
  if (invalidGateways.length) errors.push(`Unsupported PAYMENT_GATEWAYS_ENABLED value(s): ${invalidGateways.join(", ")}.`);
  if (process.env.ALLOW_TRUSTED_USER_HEADER === "true" && process.env.TRUSTED_PROXY_ENFORCED !== "true") {
    errors.push("ALLOW_TRUSTED_USER_HEADER requires TRUSTED_PROXY_ENFORCED=true in production.");
  }
  if (process.env.ALLOW_LEGACY_MEDIA_URLS === "true") {
    errors.push("ALLOW_LEGACY_MEDIA_URLS must be disabled in production.");
  }
  if (process.env.PROVIDER_PORTAL_DEV_USER_ID && process.env.PROVIDER_PORTAL_DEV_USER_ID !== "00000000-0000-0000-0000-000000000000") {
    errors.push("PROVIDER_PORTAL_DEV_USER_ID must not be configured to a real user in production.");
  }
  if (process.env.PROVIDER_PORTAL_LOCAL_AUTH === "true") {
    errors.push("PROVIDER_PORTAL_LOCAL_AUTH must be disabled in production.");
  }
  for (const key of ["PROVIDER_PORTAL_SSO_SECRET", "PROVIDER_PORTAL_SESSION_SECRET"] as const) {
    const value = process.env[key]?.trim() || "";
    if (value && value.length < 32) errors.push(`${key} must contain at least 32 characters in production.`);
  }
  return { ready: missing.length === 0 && errors.length === 0, missing, errors, enabledPaymentGateways: enabledGateways };
}

export function assertProductionReadyEnv() {
  if (process.env.NODE_ENV !== "production") return;
  // `next build` imports server modules while collecting route data. Deployment
  // secrets are runtime requirements and must never be required or embedded to
  // compile the release artifact. Runtime readiness and the orchestrator
  // remain responsible for validating the deployed environment.
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"
  ) return;
  const report = getProductionReadiness();
  if (!report.ready) {
    const parts = [
      report.missing.length ? `Configure: ${report.missing.join(", ")}.` : "",
      ...report.errors,
    ].filter(Boolean);
    throw new Error(`Production environment is not launch-ready. ${parts.join(" ")}`);
  }
}
