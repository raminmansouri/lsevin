import type { ConsultationPackageOption } from "./types";

/**
 * Doctors for video consultation, shown on the page the home card opens: the ones an
 * admin registers here and the ones clinics add in the provider portal. They are their
 * own records, not category.staff.
 * Shared by the server actions and client components.
 */

export type VideoDoctor = {
  id: string;
  name: string;
  /** The clinic the doctor consults for, when a clinic added them in the provider portal. */
  clinicName: string | null;
  /** The packages this doctor offers this visitor, shortest first. */
  packages: ConsultationPackageOption[];
  bio: string | null;
  medicalCouncilNumber: string | null;
  experienceYears: number | null;
  imageUrl: string | null;
};

/** A doctor's own record, before the visitor's packages are added. */
export type VideoDoctorProfile = Omit<VideoDoctor, "clinicName" | "packages">;

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
  /**
   * Set when a clinic added this doctor in the provider portal. The clinic then sets the
   * packages there and `clinic.packages` lists the active ones; `packages` below is unused.
   */
  clinic: { name: string | null; status: string; packages: DoctorPackageDraft[] } | null;
  /** The doctor's 20, 45 and 60 minute packages, as the admin edits them. */
  packages: DoctorPackageDraft[];
};

/** One package as the admin form edits it: toman for Iranian patients, dollars for everyone else. */
export type DoctorPackageDraft = {
  minutes: number;
  isActive: boolean;
  priceToman: number | null;
  priceUsd: number | null;
};

export type VideoDoctorsPageData = {
  enabled: boolean;
  durationMinutes: number;
  priceLabel: string;
  packages: ConsultationPackageOption[];
  doctors: VideoDoctor[];
};
