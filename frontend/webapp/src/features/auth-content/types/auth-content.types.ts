export type TranslationMap = Record<string, string>;
export type JsonRecord = Record<string, unknown>;

export type AuthPageContent = {
  id?: string;
  itemKey: string;
  eyebrow?: string;
  title: string;
  description?: string;
  body?: string;
  mediaUrl?: string | null;
  mediaKind?: string;
  alt?: string;
  buttonTitle?: string;
  buttonUrl?: string | null;
  openInNewTab?: boolean;
  style?: JsonRecord;
  metadata?: JsonRecord;
};

export type AuthOnboardingStepContent = AuthPageContent & {
  primaryButton: string;
  primaryButtonUrl?: string | null;
  secondaryButton?: string;
  secondaryButtonUrl?: string | null;
};

export type AuthContentAdminListItem = {
  id: string;
  typeCode: string;
  itemKey: string;
  title: string;
  subtitle: string;
  mediaUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  lastModifiedDate: string;
};

export type AuthContentAdminDetails = {
  id: string;
  typeCode: string;
  itemKey: string;
  mediaUrl: string | null;
  mediaKind: "image" | "video" | "gif" | "file";
  eyebrow: TranslationMap;
  title: TranslationMap;
  subtitle: TranslationMap;
  body: TranslationMap;
  buttonTitle: TranslationMap;
  buttonUrl: string | null;
  alt: TranslationMap;
  displayOrder: number;
  isActive: boolean;
  openInNewTab: boolean;
  style: JsonRecord;
  metadata: JsonRecord;
};
