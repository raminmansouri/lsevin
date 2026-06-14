"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { createAdminRow, deleteAdminRow, revokeRefreshToken, runIdentityUserCommand, updateAdminRow } from "../lib/db";
import { AdminCrudActionSchema, AdminDeleteActionSchema, IdentityUserCommandSchema, RevokeRefreshTokenSchema } from "./schema";

type AdminCrudInput = z.infer<typeof AdminCrudActionSchema>;
type AdminDeleteInput = z.infer<typeof AdminDeleteActionSchema>;
type IdentityUserCommandInput = z.infer<typeof IdentityUserCommandSchema>;
type RevokeRefreshTokenInput = z.infer<typeof RevokeRefreshTokenSchema>;

function revalidateAdminData() {
  revalidatePath("/admin/platform-data");
}

const createHandler = async (input: AdminCrudInput) => {
  const data = await createAdminRow(input.schema, input.table, input.values);
  revalidateAdminData();
  return { data, error: undefined };
};

const updateHandler = async (input: AdminCrudInput) => {
  if (!input.rowId) throw new Error("Missing row id.");
  const data = await updateAdminRow(input.schema, input.table, input.rowId, input.values);
  revalidateAdminData();
  return { data, error: undefined };
};

const deleteHandler = async (input: AdminDeleteInput) => {
  const data = await deleteAdminRow(input.schema, input.table, input.rowId);
  revalidateAdminData();
  return { data, error: undefined };
};

const identityCommandHandler = async (input: IdentityUserCommandInput) => {
  const data = await runIdentityUserCommand(input.command, input.userId);
  revalidateAdminData();
  return { data, error: undefined };
};

const revokeRefreshTokenHandler = async (input: RevokeRefreshTokenInput) => {
  const data = await revokeRefreshToken(input.tokenId);
  revalidateAdminData();
  return { data, error: undefined };
};

export const createAdminRowAction = createAuthenticatedSafeAction(AdminCrudActionSchema, createHandler);
export const updateAdminRowAction = createAuthenticatedSafeAction(AdminCrudActionSchema, updateHandler);
export const deleteAdminRowAction = createAuthenticatedSafeAction(AdminDeleteActionSchema, deleteHandler);
export const identityUserCommandAction = createAuthenticatedSafeAction(IdentityUserCommandSchema, identityCommandHandler);
export const revokeRefreshTokenAction = createAuthenticatedSafeAction(RevokeRefreshTokenSchema, revokeRefreshTokenHandler);
