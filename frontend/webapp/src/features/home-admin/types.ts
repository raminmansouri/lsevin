import type { LocalizedContent } from '@/features/shared/types/localization';

export type AdminHomeSection = {
  sectionKey: string;
  badge: LocalizedContent;
  title: LocalizedContent;
  subtitle: LocalizedContent;
  description: LocalizedContent;
  buttonLabel: LocalizedContent;
  buttonHref: string;
  imageUrl: string;
  iconName: string;
  displayOrder: number;
  isActive: boolean;
  metadata: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type HomeSectionListItem = {
  sectionKey: string;
  title: string;
  subtitle: string;
  buttonHref: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  updatedAt: string | null;
};
