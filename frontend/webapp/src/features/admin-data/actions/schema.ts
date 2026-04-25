import { z } from "zod/v4";

export const AdminSchemaNameSchema = z.enum(["booking", "identity", "customer"]);

export const AdminCrudActionSchema = z.object({
  schema: AdminSchemaNameSchema,
  table: z.string().min(1),
  rowId: z.record(z.string(), z.unknown()).optional(),
  values: z.record(z.string(), z.unknown()).default({}),
});

export const AdminDeleteActionSchema = z.object({
  schema: AdminSchemaNameSchema,
  table: z.string().min(1),
  rowId: z.record(z.string(), z.unknown()),
});

export const IdentityUserCommandSchema = z.object({
  command: z.enum(["activate", "suspend", "confirm-profile", "clear-lockout"]),
  userId: z.guid(),
});

export const RevokeRefreshTokenSchema = z.object({
  tokenId: z.guid(),
});
