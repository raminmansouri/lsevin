const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\//i;

export type ProviderApplicationDraftInput = {
  applicationId?: string;
  providerTypeId: string;
  legalName: string;
  displayNameTranslations: Record<string, string>;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  addressText: string;
  websiteUrl?: string;
  submissionPayload: Record<string, unknown>;
  documents: Array<{ kind: string; reference: string }>;
};

function length(value: string, max: number, field: string, errors: string[]) {
  if (value.trim().length > max) errors.push(`${field} must be ${max} characters or fewer.`);
}

export function validateProviderApplication(input: ProviderApplicationDraftInput, mode: "draft" | "submit") {
  const errors: string[] = [];
  if (!UUID_RE.test(input.providerTypeId)) errors.push("Choose a valid provider type.");
  length(input.legalName, 250, "Legal name", errors);
  length(input.email, 250, "Email", errors);
  length(input.phoneCountryCode, 8, "Phone country code", errors);
  length(input.phoneNumber, 20, "Phone number", errors);
  length(input.addressText, 2000, "Address", errors);
  length(input.websiteUrl || "", 500, "Website", errors);
  const translations = Object.values(input.displayNameTranslations).map((value) => value.trim()).filter(Boolean);
  if (mode === "submit") {
    if (!input.legalName.trim()) errors.push("Legal name is required.");
    if (!translations.length) errors.push("At least one display-name translation is required.");
    if (!EMAIL_RE.test(input.email.trim())) errors.push("A valid email is required.");
    if (!input.phoneNumber.trim()) errors.push("Phone number is required.");
    if (!String(input.submissionPayload.country || "").trim()) errors.push("Country is required.");
    if (!String(input.submissionPayload.city || "").trim()) errors.push("City is required.");
    if (!input.addressText.trim()) errors.push("Address is required.");
    if (!input.documents.some((doc) => doc.reference.trim())) errors.push("At least one application document is required.");
  }
  if (input.websiteUrl?.trim() && !URL_RE.test(input.websiteUrl.trim())) errors.push("Website must start with http:// or https://.");
  if (errors.length) throw Object.assign(new Error(errors.join(" ")), { code: "APPLICATION_VALIDATION", fields: errors });
}


export type StaffApplicationDraftInput = ProviderApplicationDraftInput & {
  submissionPayload: Record<string, unknown> & {
    providerId?: string;
    staffTitleTranslations?: Record<string, string>;
    staffSpecialtyTranslations?: Record<string, string>;
    existingProfileReference?: string;
  };
};

export function validateStaffApplication(input: StaffApplicationDraftInput, mode: "draft" | "submit") {
  validateProviderApplication(input, mode === "submit" ? "draft" : mode);
  const errors: string[] = [];
  const providerId = String(input.submissionPayload.providerId || "").trim();
  const existingProfileReference = String(input.submissionPayload.existingProfileReference || "").trim();
  const titleTranslations = Object.values(input.submissionPayload.staffTitleTranslations || {}).map((value) => String(value).trim()).filter(Boolean);
  const specialtyTranslations = Object.values(input.submissionPayload.staffSpecialtyTranslations || {}).map((value) => String(value).trim()).filter(Boolean);
  if (providerId && !UUID_RE.test(providerId)) errors.push("Choose a valid provider / clinic.");
  if (existingProfileReference && !UUID_RE.test(existingProfileReference)) errors.push("Existing staff profile ID must be a valid UUID.");
  if (mode === "submit") {
    if (!providerId) errors.push("Choose the provider / clinic you work with.");
    if (!titleTranslations.length) errors.push("At least one professional-title translation is required.");
    if (!specialtyTranslations.length) errors.push("At least one specialty translation is required.");
    if (!input.documents.some((doc) => doc.reference.trim())) errors.push("At least one staff evidence file is required before submission.");
  }
  if (errors.length) throw Object.assign(new Error(errors.join(" ")), { code: "STAFF_APPLICATION_VALIDATION", fields: errors });
}
