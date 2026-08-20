import "server-only";

/**
 * MeliPayamak pattern-mode SMS, ported from the .NET Identity module.
 *
 * The account behind this integration has **no free-text sender line**. Its only
 * capability is `SendSMS/BaseServiceNumber` (the "SendByBaseNumber2" endpoint),
 * which renders a template that was pre-approved in the MeliPayamak panel and
 * takes only the *variables* for that template. So `text` here is not a message —
 * it is the semicolon-separated argument list for pattern `bodyId`.
 *
 * The C# client this mirrors:
 *   src/Modules/Identity/LSevin.Modules.Identity/Infrastructure/HttpClients/
 *     MeliPayamak/MeliPayamakApiClient.cs
 * and the comment that documents the convention:
 *   .../Identity/Services/OtpSenderService.cs — "For pattern mode
 *   (SendByBaseNumber2), send only the variables separated by semicolons".
 *
 * Why this lives in the webapp rather than behind a new .NET endpoint: the
 * Identity module exposes only the nine auth routes in its Routes.cs, none of
 * which accepts a message body, and adding one means a .NET change plus gateway
 * routing for a feature that is otherwise entirely Postgres + Next.js. The cost
 * is that the credential now exists in two places — see the env block below.
 */

const DEFAULT_BASE_URL = "https://rest.payamak-panel.com/api/";

/**
 * Flat rather than a `{ok:true}|{ok:false}` union on purpose: this project compiles
 * with `strict: false`, and without `strictNullChecks` TypeScript does not narrow a
 * discriminated union by a boolean discriminant — every `result.error` after an
 * `if (!result.ok)` would be an error. Optional fields cost a little safety and
 * work under the compiler settings this repo actually uses.
 */
export type SmsSendResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
};

export type MeliPayamakCredentials = {
  username: string;
  password: string;
  baseUrl: string;
};

/**
 * Credentials come from the environment, not from the settings table: they are a
 * secret, and the settings table is editable by any admin through the panel.
 * Only the non-secret pattern ids are configurable there.
 */
export function readMeliPayamakCredentials(): MeliPayamakCredentials | null {
  const username = process.env.MELIPAYAMAK_USERNAME?.trim();
  const password = process.env.MELIPAYAMAK_PASSWORD?.trim();

  if (!username || !password) return null;

  const baseUrl = process.env.MELIPAYAMAK_BASE_URL?.trim() || DEFAULT_BASE_URL;

  return {
    username,
    password,
    baseUrl: baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  };
}

/** Shows only the last four digits, matching the .NET client's log masking. */
export function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  return `${phone.slice(0, 4)}***${phone.slice(-4)}`;
}

/**
 * Pattern variables are joined with `;`, so a value that itself contains one would
 * silently shift every later placeholder. Newlines break the wire format outright.
 */
export function encodePatternVariables(values: Array<string | null | undefined>): string {
  return values
    .map((value) => (value ?? "").toString().replace(/[;\r\n]+/g, " ").trim())
    .join(";");
}

type SendPatternSmsArgs = {
  to: string;
  bodyId: string;
  variables: string;
  credentials: MeliPayamakCredentials;
  timeoutMs?: number;
};

export async function sendPatternSms({
  to,
  bodyId,
  variables,
  credentials,
  timeoutMs = 15_000,
}: SendPatternSmsArgs): Promise<SmsSendResult> {
  // A hung provider must not hold the customer's submission open. The caller
  // already treats a failure as non-fatal; this bounds how long it waits to
  // find out.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      new URL("SendSMS/BaseServiceNumber", credentials.baseUrl),
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: credentials.username,
          password: credentials.password,
          text: variables,
          to,
          bodyId,
        }),
        signal: controller.signal,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    // The endpoint answers with JSON, but a gateway error page or a plain-text
    // fault would throw here and be reported as an unusable response rather than
    // as a success.
    const raw = await response.text();

    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return { ok: false, error: `Unparsable response: ${raw.slice(0, 200)}` };
    }

    const body = payload as {
      Value?: unknown;
      value?: unknown;
      RetStatus?: unknown;
      retStatus?: unknown;
      StrRetStatus?: unknown;
      strRetStatus?: unknown;
    };

    const status = Number(body.RetStatus ?? body.retStatus ?? NaN);
    const statusText = String(body.StrRetStatus ?? body.strRetStatus ?? "");
    const value = String(body.Value ?? body.value ?? "");

    // Success is RetStatus 0 or 1, or StrRetStatus "Ok" — the same three-way test
    // the .NET client uses (SendSmsResponseClientDto.IsSuccess). RetStatus 0 is
    // overloaded: it means both "success" and "invalid username/password", which
    // is why Value must ALSO be a message id below rather than an error code.
    // Documented failures include -1 access denied, -3 line not defined,
    // -4 invalid bodyId and -5 text doesn't match the template's variables — that
    // last one is what a wrong variable count looks like, so it is worth reading.
    const statusLooksOk =
      status === 0 || status === 1 || statusText.toLowerCase() === "ok";

    // On success Value is a numeric recId. Failures put an error code here, and
    // those are negative or non-numeric, so requiring plain digits separates the
    // two cases that RetStatus 0 conflates.
    const valueIsMessageId = /^\d+$/.test(value);

    if (!statusLooksOk || !valueIsMessageId) {
      return {
        ok: false,
        error: `Provider error ${Number.isNaN(status) ? "?" : status}${
          statusText ? `: ${statusText}` : ""
        }${value ? ` (${value})` : ""}`,
      };
    }

    return { ok: true, messageId: value };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, error: `Timed out after ${timeoutMs}ms` };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown network error",
    };
  } finally {
    clearTimeout(timer);
  }
}
