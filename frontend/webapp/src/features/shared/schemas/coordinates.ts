import { z } from "zod";

/**
 * Zod schema for coordinate validation
 */
export const coordinatesSchema = z.object({
  longitude: z
    .number()
    .min(-180, { message: "Longitude must be between -180 and 180" })
    .max(180, { message: "Longitude must be between -180 and 180" }),
  latitude: z
    .number()
    .min(-90, { message: "Latitude must be between -90 and 90" })
    .max(90, { message: "Latitude must be between -90 and 90" }),
});

/**
 * Optional coordinates schema (nullable)
 */
export const optionalCoordinatesSchema = coordinatesSchema
  .nullable()
  .optional();

export type CoordinatesInput = z.infer<typeof coordinatesSchema>;
