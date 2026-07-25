import "server-only";

import db from "@/config/database/db";

export class RateLimitError extends Error {
  constructor(
    message: string,
    readonly retryAfterSeconds: number,
    readonly bucket: string
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

type RateLimitConfig = { limit: number; window_seconds: number };

const FALLBACKS: Record<string, RateLimitConfig> = {
  "rate_limit.deposit": { limit: 10, window_seconds: 3600 },
  "rate_limit.withdrawal": { limit: 5, window_seconds: 3600 },
};

/**
 * Consumes one token for `identity` against a configured limit.
 *
 * Deliberately runs on the shared pool rather than inside the caller's transaction.
 * A rate limiter that participates in the caller's transaction is not a rate limiter:
 * when the operation fails and rolls back, the attempt rolls back with it, so an
 * attacker hammering an endpoint that always fails is never counted. Consuming on a
 * separate connection means the attempt is recorded whatever happens next.
 *
 * For the same reason it is called BEFORE the work begins, not during it.
 *
 * The counter itself is atomic — `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` in
 * accounting.fn_consume_rate_limit — so two simultaneous requests cannot both read the
 * same count and both be let through.
 */
export async function consumeRateLimit(input: {
  /** e.g. "withdrawal" — combined with the identity to form the bucket. */
  action: string;
  /** Usually the user id. Never something the caller controls, like a header. */
  identity: string;
  /** Key in accounting.settings holding `{ limit, window_seconds }`. */
  settingKey: string;
}): Promise<void> {
  const bucket = `${input.action}:${input.identity}`;

  let config: RateLimitConfig;
  try {
    const [row] = await db<{ value: RateLimitConfig | null }[]>`
      select value from accounting.settings where key = ${input.settingKey}
    `;
    config = row?.value ?? FALLBACKS[input.settingKey] ?? { limit: 10, window_seconds: 3600 };
  } catch {
    // The accounting schema is not installed yet. Fall back to the built-in limits
    // rather than letting the endpoint run unlimited — failing open on a money endpoint
    // is the wrong default.
    config = FALLBACKS[input.settingKey] ?? { limit: 10, window_seconds: 3600 };
  }

  const limit = Number(config.limit);
  const windowSeconds = Number(config.window_seconds);
  if (!Number.isFinite(limit) || limit <= 0) return; // explicitly disabled

  let allowed: boolean;
  try {
    const [row] = await db<{ allowed: boolean }[]>`
      select accounting.fn_consume_rate_limit(${bucket}, ${limit}, ${windowSeconds}) as allowed
    `;
    allowed = row?.allowed ?? true;
  } catch {
    // Schema missing: nothing to count against. Let it through — the alternative is
    // blocking every deposit until the migrations run.
    return;
  }

  if (!allowed) {
    throw new RateLimitError(
      `Too many ${input.action} requests. Try again later.`,
      windowSeconds,
      bucket
    );
  }

  // Opportunistic housekeeping. The table only ever grows otherwise, and a cron for it
  // would be one more thing to forget; 1-in-100 keeps it small at negligible cost.
  if (Math.random() < 0.01) {
    void pruneRateLimits().catch(() => {});
  }
}

/** Drops windows that closed more than a day ago. */
export async function pruneRateLimits(): Promise<void> {
  await db`delete from accounting.rate_limits where window_start < now() - interval '1 day'`;
}
