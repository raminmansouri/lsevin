/**
 * Doctor finder behind the home consultation card: the patient picks a medical
 * category, then sees the doctors (category.staff) practising in it.
 *
 * Shared by the server actions and the client sheet, so no server-only imports.
 */

export type DoctorFinderCategory = {
  id: string;
  name: string;
  icon: string | null;
  iconUrl: string | null;
  parentId: string | null;
  /** Active doctors in this category or anything beneath it. */
  doctorCount: number;
};

export type DoctorFinderGroup = {
  /** The top-level category; also offered as the "all" chip of its group. */
  root: DoctorFinderCategory;
  categories: DoctorFinderCategory[];
};

export type DoctorFinderDoctor = {
  id: string;
  name: string;
  title: string | null;
  specialty: string | null;
  imageUrl: string | null;
  rating: number;
  reviewCount: number;
  experienceYears: number | null;
  /** The first clinic/hospital the doctor works at, for context on the card. */
  providerName: string | null;
};

/** Error codes the sheet translates (Consultation.finder.errors.*). */
export type DoctorFinderError = "invalidCategory" | "loadFailed";
