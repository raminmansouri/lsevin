"use server";

import type {
  ReferralAdminDashboardData,
  ReferralPoliciesData,
  SaveReferralPoliciesInput,
  SaveReferralPoliciesResult,
} from "./types";
import {
  createReferralAdminSqlClient,
  getReferralAdminDashboardData,
  getReferralPoliciesData,
  saveReferralPolicies,
} from "./queries";

export async function getReferralAdminDashboardDataAction(): Promise<ReferralAdminDashboardData> {
  const sql = createReferralAdminSqlClient();

  try {
    return await getReferralAdminDashboardData(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function getReferralPoliciesDataAction(): Promise<ReferralPoliciesData> {
  const sql = createReferralAdminSqlClient();

  try {
    return await getReferralPoliciesData(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function saveReferralPoliciesAction(
  input: SaveReferralPoliciesInput
): Promise<SaveReferralPoliciesResult> {
  const sql = createReferralAdminSqlClient();

  try {
    if (!input.programId) {
      throw new Error("Program id is required.");
    }

    if (!input.name.trim()) {
      throw new Error("Program name is required.");
    }

    if (input.rules.length === 0) {
      throw new Error("Add at least one reward rule.");
    }

    await saveReferralPolicies(sql, input);

    return {
      ok: true,
      message: "Referral policy saved successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to save referral policy.",
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}
