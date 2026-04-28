export type SponseredSliderSortKey = "displayOrder" | "title" | "isActive";

export interface MediaTypeOption {
  id: string;
  name: string;
}

export interface SponseredSliderFormOptions {
  mediaTypes: MediaTypeOption[];
}

export interface SponseredSliderItem {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  buttonLabel?: string | null;
  link?: string | null;
  url?: string | null;
  mediaTypeId?: string | null;
  mediaTypeName?: string | null;
  mediaKind?: "image" | "video" | "gif" | "file" | "unknown";
  displayOrder: number;
  isActive: boolean;
}

export interface SponseredSliderDetails extends SponseredSliderItem {
  mediaId?: string;
}

export interface SponseredSliderMutationInput {
  sliderId?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  link?: string;
  url?: string;
  mediaId?: string;
  mediaTypeId?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ActiveSponseredSlide {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  buttonLabel?: string | null;
  link?: string | null;
  url: string;
  mediaTypeName?: string | null;
  mediaKind: "image" | "video" | "gif" | "file" | "unknown";
  displayOrder: number;
}
