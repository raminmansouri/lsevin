import { z } from "zod/v4";

export const genderValues = [
  "female",
  "male",
  "other",
  "prefer-not-to-say",
] as const;

export const profileFormSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required").max(100),
  lastName: z.string().trim().min(2, "Last name is required").max(50),
  email: z.string().trim().email("Enter a valid email").max(250),

  dateOfBirth: z
    .string()
    .refine(
      (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Invalid date"
    ),

  gender: z.enum(genderValues).or(z.literal("")),

  address: z.string().trim().min(2, "Address is required").max(500),
  city: z.string().trim().min(2, "City is required").max(100),
  country: z.string().trim().min(2, "Country is required").max(100),
});

export type ProfileFormValues = z.input<typeof profileFormSchema>;
export type ParsedProfileFormValues = z.output<typeof profileFormSchema>;

export type EditProfileInitialData = ProfileFormValues & {
  phoneCountryCode: string;
  phoneNumber: string;
  isProfileConfirmed: boolean;
  profileImageUrl: string | null;
};
