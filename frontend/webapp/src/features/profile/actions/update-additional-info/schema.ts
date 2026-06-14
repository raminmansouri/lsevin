import { z } from "zod/v4";

import { OptionalLocalizedContentSchema } from "@/features/shared/schemas/localization";
import { Gender } from "@/features/shared/types/common";

// Address schema for profile form using codes instead of names
const profileAddressSchema = z.object({
  countryCode: z.string().refine((val) => val.length > 0, {
    params: { code: "required" },
  }),
  cityCode: z.string().refine((val) => val.length > 0, {
    params: { code: "required" },
  }),
  street: OptionalLocalizedContentSchema.optional(),
  detail: OptionalLocalizedContentSchema.optional(),
  zipCode: z.string().optional(),
});

// Main schema for update additional info
export const UpdateAdditionalInfoSchema = z.object({
  birthDate: z.string().refine((val) => val.length > 0, {
    params: { code: "required" },
  }),
  address: profileAddressSchema,
  gender: z.enum(Gender),
});
