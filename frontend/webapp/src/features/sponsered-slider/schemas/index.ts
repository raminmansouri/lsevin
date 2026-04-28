import { z } from "zod/v4";

import { DEFAULT_SLIDER_BUTTON_LABEL } from "../constants";

/**
 * Intentionally loose schemas.
 *
 * The admin form should not fail silently because of strict zod rules.
 * PostgreSQL is still the final source of truth, but these schemas only coerce
 * common browser/form values and let the server action run so we can see useful logs.
 */
const looseText = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string") return value.trim() === "" ? undefined : value.trim();
    return String(value).trim() || undefined;
  },
  z.string().optional()
);

const looseRequiredText = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    return String(value).trim();
  },
  z.string()
);

const looseNumber = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  },
  z.number().int().catch(0)
);

const looseBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "1", "on", "yes"].includes(value.toLowerCase());
  return Boolean(value);
}, z.boolean().catch(true));

const SponseredSliderBaseSchema = z.object({
  sliderId: looseText,
  mediaId: looseText,
  url: looseText,
  mediaTypeId: looseText,
  title: looseText,
  subtitle: looseText,
  buttonLabel: z.preprocess(
    (value) => {
      if (value === null || value === undefined) return DEFAULT_SLIDER_BUTTON_LABEL;
      if (typeof value === "string") return value.trim() || DEFAULT_SLIDER_BUTTON_LABEL;
      return String(value).trim() || DEFAULT_SLIDER_BUTTON_LABEL;
    },
    z.string().catch(DEFAULT_SLIDER_BUTTON_LABEL)
  ),
  link: looseText,
  displayOrder: looseNumber,
  isActive: looseBoolean,
});

export const SponseredSliderSchema = SponseredSliderBaseSchema;

export const CreateSponseredSliderSchema = SponseredSliderBaseSchema.omit({ sliderId: true }).extend({
  sliderId: looseText.optional(),
});

export const UpdateSponseredSliderSchema = SponseredSliderBaseSchema.extend({
  sliderId: looseRequiredText,
});

export const DeleteSponseredSliderSchema = z.object({ sliderId: looseRequiredText });

export const ChangeSponseredSliderActivationSchema = z.object({
  sliderId: looseRequiredText,
  isActive: looseBoolean,
});

export const MoveSponseredSliderSchema = z.object({
  sliderId: looseRequiredText,
  direction: z.enum(["up", "down"]).catch("down"),
});

export type SponseredSliderFormInput = z.infer<typeof SponseredSliderSchema>;
export type CreateSponseredSliderInput = z.infer<typeof CreateSponseredSliderSchema>;
export type UpdateSponseredSliderInput = z.infer<typeof UpdateSponseredSliderSchema>;
export type DeleteSponseredSliderInput = z.infer<typeof DeleteSponseredSliderSchema>;
export type ChangeSponseredSliderActivationInput = z.infer<typeof ChangeSponseredSliderActivationSchema>;
export type MoveSponseredSliderInput = z.infer<typeof MoveSponseredSliderSchema>;
