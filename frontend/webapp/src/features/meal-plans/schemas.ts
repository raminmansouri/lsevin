import { z } from "zod/v4";

const price = z.number().min(0).max(1_000_000_000_000).nullable();

// Each price is the FULL nightly price of the room with that plan, in the room's own currency.
// null = the room does not offer that plan. Room only is the room's own price and is not stored here.
export const saveMealPlansSchema = z
  .object({
    providerServiceId: z.string().uuid(),
    breakfastPrice: price,
    fullBoardPrice: price,
  })
  .refine((v) => v.breakfastPrice == null || v.fullBoardPrice == null || v.fullBoardPrice >= v.breakfastPrice, {
    message: "Full board must not cost less than breakfast",
    path: ["fullBoardPrice"],
  });
