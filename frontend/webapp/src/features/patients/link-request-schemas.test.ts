import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SubmitAccountLinkRequestSchema } from "./link-request-schemas";
import { PATIENT_RELATIONSHIP_TYPES } from "./schemas";

/**
 * Regression test for the bug this migration pair fixed: 0060 created
 * patient.account_link_requests with a `relationship_type` check constraint
 * that only allowed family-member values. When the app-level schema
 * (SubmitAccountLinkRequestSchema) was widened to also accept "self", the
 * DB constraint was never updated to match -- every "self" submission threw
 * an unhandled check-constraint violation, silently failing with no
 * request ever created and no error the customer could see (see
 * 0063_account_link_requests_self.sql's own header for the full story).
 *
 * This asserts the two layers stay in sync going forward: every value the
 * Zod schema accepts must also be present in the *effective* DB constraint
 * (0063's ALTER, which fully replaces 0060's original CREATE TABLE check).
 */
describe("account_link_requests relationship_type: app schema vs DB constraint", () => {
  it("SubmitAccountLinkRequestSchema accepts every PATIENT_RELATIONSHIP_TYPES value, including self", () => {
    for (const type of PATIENT_RELATIONSHIP_TYPES) {
      expect(SubmitAccountLinkRequestSchema.safeParse({
        relationshipType: type,
        identifierType: "ir_national_id",
        identifierValue: "0012345678",
        firstName: "Test",
        lastName: "User",
      }).success).toBe(true);
    }
  });

  it("the effective DB check constraint (0063, which supersedes 0060's) allows every value the app schema accepts", () => {
    const migration = readFileSync(
      new URL("../../../db/migrations/0063_account_link_requests_self.sql", import.meta.url),
      "utf8"
    );
    const match = migration.match(/relationship_type in \(([^)]+)\)/);
    expect(match, "0063 should define the relationship_type check constraint").toBeTruthy();
    const dbValues = (match![1].match(/'([a-z_]+)'/g) ?? []).map((v) => v.replace(/'/g, ""));
    for (const type of PATIENT_RELATIONSHIP_TYPES) {
      expect(dbValues).toContain(type);
    }
  });
});
