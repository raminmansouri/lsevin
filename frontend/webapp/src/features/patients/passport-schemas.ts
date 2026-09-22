import { z } from "zod/v4";

import { PASSPORT_LANGUAGES, PASSPORT_SECTIONS } from "./passport-types";

export const GeneratePassportSchema = z.object({
  patientId: z.uuid(),
  language: z.enum(PASSPORT_LANGUAGES),
  includedSections: z.array(z.enum(PASSPORT_SECTIONS)).min(1),
});
export type GeneratePassportInput = z.input<typeof GeneratePassportSchema>;
