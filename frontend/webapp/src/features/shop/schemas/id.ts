import { z } from "zod";

/**
 * UUID-shaped identifier.
 *
 * `z.string().uuid()` (zod v4) enforces the RFC-4122 version/variant nibbles.
 * Some seeded / hand-authored rows in this deployment use deterministic ids like
 * `33333333-0000-0000-0000-…` whose version nibble is `0`; Postgres' `uuid` type
 * accepts them and every write here casts `::uuid`, which is the authoritative
 * validator. So Shop only checks the *shape* and lets the database reject a
 * genuinely malformed value.
 */
export const shopId = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, "Invalid id");
