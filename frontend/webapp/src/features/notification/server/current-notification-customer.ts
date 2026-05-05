import "server-only";

import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import sql from "@/config/database/db";
import { readData } from "@/config/http/http-service.server";
import { CUSTOMER_MODULE_BASE_PATH } from "@/features/shared/types/constants";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type UnknownRecord = Record<string, unknown>;

type CurrentUserPayload = {
  customerId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  phoneNumberCountryCode?: string | null;
};

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value?: string | null) {
  return Boolean(value && UUID_REGEX.test(value));
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))),
  );
}

function readBearerToken(value?: string | null) {
  const headerValue = value?.trim();
  if (!headerValue) return null;
  const match = /^Bearer\s+(.+)$/i.exec(headerValue);
  return match?.[1]?.trim() || null;
}

async function getRequestHeader(request: NextRequest | Request | undefined, name: string) {
  const fromRequest = request?.headers.get(name);
  if (fromRequest) return fromRequest;

  try {
    const headerStore = await headers();
    return headerStore.get(name);
  } catch {
    return null;
  }
}

async function getCookieValue(request: NextRequest | Request | undefined, name: string) {
  if (request && "cookies" in request) {
    const cookieValue = (request as NextRequest).cookies.get(name)?.value;
    if (cookieValue) return cookieValue;
  }

  try {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value ?? null;
  } catch {
    return null;
  }
}

function readNestedString(record: UnknownRecord | null, path: string[]) {
  let current: unknown = record;
  for (const segment of path) {
    if (!isRecord(current)) return null;
    current = current[segment];
  }
  return asString(current);
}

function collectClaimCandidates(token: UnknownRecord | null, keys: string[]) {
  if (!token) return [];

  const direct = keys.map((key) => asString(token[key]));
  const nestedUser = keys.map((key) => readNestedString(token, ["user", key]));
  const nestedProfile = keys.map((key) => readNestedString(token, ["profile", key]));

  return unique([...direct, ...nestedUser, ...nestedProfile]);
}

async function getVerifiedNextAuthToken(request?: NextRequest | Request) {
  try {
    const token = await getToken({ req: request as any });
    return isRecord(token) ? token : null;
  } catch {
    return null;
  }
}

async function findExistingCustomerId(candidate: string | null | undefined) {
  if (!isUuid(candidate)) return null;

  const rows = await sql<{ id: string }[]>`
    select c.id::text as id
    from customer.customers c
    where c.id = ${candidate}::uuid
    limit 1
  `;

  return rows[0]?.id ?? null;
}

async function resolveCustomerIdFromUserId(candidate: string | null | undefined) {
  if (!isUuid(candidate)) return null;

  const rows = await sql<{ id: string }[]>`
    select distinct on (id) id::text as id
    from (
      select c.id, 1 as priority
      from customer.customers c
      where c.id = ${candidate}::uuid

      union all

      select c.id, 2 as priority
      from identity.asp_net_users u
      join customer.customers c
        on (
          (nullif(c.email, '') is not null and lower(c.email) = lower(u.email))
          or (
            nullif(c.phone_number, '') is not null
            and c.phone_number = u.phone_number
            and c.phone_number_country_code = u.phone_number_country_code
          )
        )
      where u.id = ${candidate}::uuid
    ) matched
    order by id, priority
    limit 1
  `;

  return rows[0]?.id ?? null;
}

async function resolveCustomerIdFromCustomerModule(input: {
  accessToken?: string | null;
  locale?: string | null;
}) {
  const accessToken = input.accessToken?.trim();
  if (!accessToken) return null;

  try {
    const response = await readData<CurrentUserPayload>(
      `${CUSTOMER_MODULE_BASE_PATH}/customer/current`,
      {
        locale: input.locale || "en",
        token: accessToken,
      } as any,
    );

    return response.data?.customerId?.trim() || null;
  } catch {
    return null;
  }
}

export async function resolveCurrentNotificationCustomerId(input?: {
  request?: NextRequest | Request;
  accessToken?: string | null;
  locale?: string | null;
}) {
  const request = input?.request;
  const verifiedToken = await getVerifiedNextAuthToken(request);

  const authorizationHeader = await getRequestHeader(request, "authorization");
  const bearerToken = readBearerToken(authorizationHeader);
  const verifiedAccessToken =
    asString(verifiedToken?.accessToken) ||
    readNestedString(verifiedToken, ["user", "accessToken"]);

  const customerCookieCandidates = await Promise.all([
    getCookieValue(request, "lsevin_customer_id"),
    getCookieValue(request, "lsevin-customer-id"),
    getCookieValue(request, "customer_id"),
    getCookieValue(request, "customer-id"),
  ]);

  const userCookieCandidates = await Promise.all([
    getCookieValue(request, "lsevin_user_id"),
    getCookieValue(request, "lsevin-user-id"),
    getCookieValue(request, "user_id"),
    getCookieValue(request, "user-id"),
  ]);

  const customerClaimCandidates = collectClaimCandidates(verifiedToken, [
    "customerId",
    "customer_id",
    "CustomerId",
  ]);

  const userClaimCandidates = collectClaimCandidates(verifiedToken, [
    "userId",
    "user_id",
    "UserId",
    "id",
    "sub",
    "nameid",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
  ]);

  for (const candidate of unique([...customerCookieCandidates, ...customerClaimCandidates])) {
    const customerId = await findExistingCustomerId(candidate);
    if (customerId) return customerId;
  }

  const customerModuleCustomerId = await resolveCustomerIdFromCustomerModule({
    accessToken: input?.accessToken || bearerToken || verifiedAccessToken,
    locale: input?.locale,
  });

  const verifiedCustomerModuleCustomerId = await findExistingCustomerId(customerModuleCustomerId);
  if (verifiedCustomerModuleCustomerId) return verifiedCustomerModuleCustomerId;

  for (const candidate of unique([...userCookieCandidates, ...userClaimCandidates])) {
    const customerId = await resolveCustomerIdFromUserId(candidate);
    if (customerId) return customerId;
  }

  return null;
}
