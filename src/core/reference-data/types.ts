export type ReferenceOption = {
  value: string;
  label: string;
  code?: string | null;
  description?: string | null;
};

export type ReferenceType = "currency" | "country" | "city";
