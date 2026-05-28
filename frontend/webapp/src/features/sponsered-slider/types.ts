export const SPONSERED_SLIDER_PLACEMENTS = [
  "home_native_ad",
  "home_top",
  "home_bottom",
  "search_results",
  "provider_detail",
  "service_detail",
  "booking_review",
] as const;

export const SPONSERED_SLIDER_OVERLAY_VARIANTS = ["dark", "light", "brand", "none"] as const;
export const SPONSERED_SLIDER_ALIGNMENTS = ["left", "center", "right"] as const;

export type SponseredSliderPlacement = (typeof SPONSERED_SLIDER_PLACEMENTS)[number];
export type SponseredSliderOverlayVariant = (typeof SPONSERED_SLIDER_OVERLAY_VARIANTS)[number];
export type SponseredSliderAlignment = (typeof SPONSERED_SLIDER_ALIGNMENTS)[number];

export type LocalizedText = Record<string, string>;

export type SponseredSliderAdminRow = {
  id: string;
  placementKey: string;
  mediaId: string | null;
  url: string | null;
  link: string | null;
  secondaryLink: string | null;
  mediaTypeId: string | null;
  mediaTypeName: string | null;
  legacyTitle: string | null;
  legacySubtitle: string | null;
  legacyButtonLabel: string | null;
  eyebrowTranslations: LocalizedText;
  titleTranslations: LocalizedText;
  subtitleTranslations: LocalizedText;
  descriptionTranslations: LocalizedText;
  buttonLabelTranslations: LocalizedText;
  badgeTranslations: LocalizedText;
  secondaryButtonLabelTranslations: LocalizedText;
  ariaLabelTranslations: LocalizedText;
  overlayVariant: SponseredSliderOverlayVariant;
  contentAlignment: SponseredSliderAlignment;
  opensInNewTab: boolean;
  displayOrder: number;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createDate: string | null;
  lastModifiedDate: string | null;
};

export type SponseredSliderPublicItem = {
  id: string;
  placementKey: string;
  mediaUrl: string;
  mediaType: "image" | "video" | "gif" | "file";
  link: string | null;
  secondaryLink: string | null;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  buttonLabel: string;
  badge: string;
  secondaryButtonLabel: string;
  ariaLabel: string;
  overlayVariant: SponseredSliderOverlayVariant;
  contentAlignment: SponseredSliderAlignment;
  opensInNewTab: boolean;
  displayOrder: number;
};
