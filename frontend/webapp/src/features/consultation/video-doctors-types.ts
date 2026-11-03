/**
 * General practitioners an admin registers for video consultation, shown on the
 * page the home card opens. They are their own records, not category.staff.
 * Shared by the server actions and client components.
 */

export type VideoDoctor = {
  id: string;
  name: string;
  bio: string | null;
  medicalCouncilNumber: string | null;
  experienceYears: number | null;
  imageUrl: string | null;
};

/** Everything the admin form edits, in both languages. */
export type AdminVideoDoctor = {
  id: string;
  nameFa: string;
  nameEn: string | null;
  bioFa: string | null;
  bioEn: string | null;
  medicalCouncilNumber: string | null;
  experienceYears: number | null;
  imageMediaId: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  /** The app account the GP signs in with; null until one is created or linked. */
  account: { userId: string; phone: string | null; email: string | null } | null;
};

export type VideoDoctorsPageData = {
  enabled: boolean;
  durationMinutes: number;
  priceLabel: string;
  doctors: VideoDoctor[];
};
