import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod/v4";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



export function ensureLocalePrefix(path: string, locale: string): string {
  if (
      path.startsWith("http") ||
      path.startsWith("/api") ||
      path.match(/^\/[a-z]{2}(\/|$)/)
  ) {
    return path;
  }

  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getSchemaFields<T extends z.ZodType>(schema: T): string[] {
  if (schema instanceof z.ZodObject) {
    const fields: string[] = [];

    // Get all top-level fields
    const topLevelFields = Object.keys(schema.shape);

    // Add top-level fields
    fields.push(...topLevelFields);

    // Add nested fields with dot notation for nested objects
    topLevelFields.forEach((field) => {
      const fieldSchema = schema.shape[field];
      if (fieldSchema instanceof z.ZodObject) {
        const nestedFields = Object.keys(fieldSchema.shape);
        nestedFields.forEach((nestedField) => {
          fields.push(`${field}.${nestedField}`);
        });
      }
    });

    return fields;
  }

  return [];
}

