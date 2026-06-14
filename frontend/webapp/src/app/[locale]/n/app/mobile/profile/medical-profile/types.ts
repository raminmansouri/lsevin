export type AllergySeverity = "mild" | "moderate" | "severe";

export type MedicalProfileAllergy = {
  id: string;
  name: string;
  severity: AllergySeverity;
  notes: string | null;
  createDate: string;
};

export type MedicalProfileMedication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  notes: string | null;
  createDate: string;
};

export type MedicalProfileCondition = {
  id: string;
  name: string;
  diagnosedDate: string | null;
  notes: string | null;
  createDate: string;
};

export type MedicalProfileDocument = {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createDate: string;
};

export type EmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};

export type MedicalProfilePageData = {
  customerId: string;
  allergies: MedicalProfileAllergy[];
  medications: MedicalProfileMedication[];
  conditions: MedicalProfileCondition[];
  documents: MedicalProfileDocument[];
  emergencyContact: EmergencyContact;
};
