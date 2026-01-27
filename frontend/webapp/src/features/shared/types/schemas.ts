import {
  CountryCode,
  isValidPhoneNumber,
  parsePhoneNumberWithError,
} from "libphonenumber-js";
import { z } from "zod/v4";

import { optionalCoordinatesSchema } from "@/features/shared/schemas/coordinates";
import { OptionalLocalizedContentSchema } from "@/features/shared/schemas/localization";

import { Gender } from "./common";
import { MAX_FILE_SIZE } from "./constants";

/**
 * A reusable Zod schema for phone number validation using libphonenumber-js
 * Validates phone numbers in international format (e.g., +989126108806)
 */
export const phoneNumberSchema = z.string().refine(
  (phoneNumber) => {
    try {
      // Try to parse the phone number
      const parsedNumber = parsePhoneNumberWithError(phoneNumber);
      // Check if it's a valid phone number
      return parsedNumber && isValidPhoneNumber(parsedNumber.number);
    } catch {
      return false;
    }
  },
  {
    params: { code: "invalid_phone" },
  }
);

/**
 * A reusable Zod schema for phone number validation with country code
 * Useful when you need to validate a phone number for a specific country
 */
export const phoneNumberWithCountrySchema = z
  .object({
    phoneNumber: z.string(),
    phoneCountryCode: z.string(),
  })
  .refine(
    (data) => {
      try {
        const countryCode = data.phoneCountryCode as CountryCode;
        const phoneNumber = parsePhoneNumberWithError(data.phoneNumber, {
          defaultCountry: countryCode,
        });
        return isValidPhoneNumber(phoneNumber.number);
      } catch {
        return false;
      }
    },
    {
      path: ["phoneNumber"],
      params: { code: "invalid_phone" },
    }
  );

/**
 * A reusable Zod schema for gender selection with default
 */
export const genderSchema = z.enum(Gender);

/**
 * A reusable Zod schema for file upload validation
 */
export const fileUploadSchema = z.file().refine(
  (val) => {
    if (!val) return false;

    const validExtensions = [
      ".zip",
      ".pdf",
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
      ".tiff",
      ".tif",
      ".ico",
      ".avif",
      ".heic",
      ".heif",
    ];
    const extension = `.${val.name.split(".").pop()?.toLowerCase()}`;

    return validExtensions.includes(extension) && val.size <= MAX_FILE_SIZE;
  },
  {
    params: { code: "invalid_file" },
  }
);

/**
 * A reusable Zod schema for address validation
 * Validates all required address fields with appropriate error codes for localization
 */
export const addressSchema = z.object({
  country: z.string().refine((val) => val.length > 0, {
    params: { code: "required" },
  }),
  city: z.string().refine((val) => val.length > 0, {
    params: { code: "required" },
  }),
  street: OptionalLocalizedContentSchema.optional(),
  detail: OptionalLocalizedContentSchema.optional(),
  zipCode: z.string().optional(),
  coordinates: optionalCoordinatesSchema,
});
