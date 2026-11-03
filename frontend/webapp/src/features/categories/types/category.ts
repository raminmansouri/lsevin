import {
  LocalizedContent,
  LocalizedContentResponse,
} from "@/features/shared/types/localization";

// List Response Type (current locale only)
export interface CategoryListItem {
  categoryId: string;
  name: string;
  description?: string;
  parentId?: string;
  parentName?: string;
  imageUrl?: string;
  gradient?: string;
  /** Whether this category is shown on the homepage (category.display_in_home_page). */
  displayInHomePage?: boolean;
  /** Landing/category-page priority (category.display_order): 1 first; 0 = none. */
  displayOrder?: number;
  /** The category's site-wide on/off switch (category.is_active). */
  isActive?: boolean;
}

// Detail Response Type (all translations)
export interface CategoryDetails {
  categoryId: string;
  name: LocalizedContentResponse;
  description?: LocalizedContentResponse;
  parentId?: string;
  parentName?: string;
  imageUrl?: string;
  gradient?: string;
  displayOrder: number;
  isActive: boolean;
  iconUrl?: string;
  createDate: string;
  lastModifiedDate: string;
}

// Input Type (for forms)
export interface CategoryInput {
  categoryId?: string;
  name: LocalizedContent;
  description?: LocalizedContent;
  parentId?: string;
  displayOrder?: number;
  isActive?: boolean;
  iconUrl?: string;
  gradient?: string;
}

// Maintain backward compatibility
export interface Category {
  categoryId: string;
  name: string;
  description?: string;
  parentId?: string;
  parentName?: string;
}
