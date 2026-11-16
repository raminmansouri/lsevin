import "server-only";

import { z } from "zod";

export const CALCULATE_BMI_DESCRIPTION =
  "Calculate body mass index (BMI) from height and weight, with its WHO category and the healthy weight range for that height. " +
  "Use it whenever the user asks about BMI, ideal or healthy weight, or whether they are overweight. " +
  "If height or weight is missing, ask for it first. Convert to centimetres and kilograms before calling " +
  "(1 inch = 2.54 cm, 1 foot = 30.48 cm, 1 lb = 0.4536 kg). " +
  "Reply in the user's language with the BMI, its category and the healthy weight range, then one short sentence that BMI is a general " +
  "screening measure and not a diagnosis. If it fits, offer a relevant consultation (nutrition, weight loss) and use search_services for it.";

export const calculateBmiInputSchema = z.object({
  heightCm: z.number().min(50).max(272).describe("Height in centimetres."),
  weightKg: z.number().min(10).max(500).describe("Weight in kilograms."),
  age: z.number().int().min(2).max(120).optional().describe("Age in years, if the user gave it."),
});

export type CalculateBmiInput = z.infer<typeof calculateBmiInputSchema>;

const round1 = (value: number) => Math.round(value * 10) / 10;

export function calculateBmi(input: CalculateBmiInput) {
  const meters = input.heightCm / 100;
  const squared = meters * meters;
  const bmi = input.weightKg / squared;
  const category =
    bmi < 18.5
      ? "underweight"
      : bmi < 25
        ? "normal"
        : bmi < 30
          ? "overweight"
          : bmi < 35
            ? "obesity_class_1"
            : bmi < 40
              ? "obesity_class_2"
              : "obesity_class_3";
  const child = input.age != null && input.age < 18;

  return {
    ok: true as const,
    bmi: round1(bmi),
    category: child ? "not_applicable_under_18" : category,
    healthyWeightKg: child ? null : { min: round1(18.5 * squared), max: round1(24.9 * squared) },
    note: child
      ? "Under 18 the adult categories do not apply: BMI is read on age and sex percentile charts. Suggest seeing a paediatrician."
      : null,
  };
}