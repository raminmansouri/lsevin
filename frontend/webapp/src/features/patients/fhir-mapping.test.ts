import { describe, expect, it } from "vitest";

import { buildPatientBundle, toFhirCondition, toFhirPatient, validateFhirResource } from "./fhir-mapping";
import type { PatientConditionRow } from "./clinical-types";
import type { PatientRow } from "./types";

const patient: PatientRow = {
  id: "11111111-1111-1111-1111-111111111111",
  publicId: "PTABCDEF1234",
  firstName: "Sara",
  middleName: null,
  lastName: "Ahmadi",
  preferredName: null,
  birthDate: "1990-05-01",
  birthDatePrecision: "day",
  sexAtBirth: "female",
  gender: null,
  nationalityCountryCode: "IR",
  primaryLanguage: "fa",
  status: "active",
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const condition: PatientConditionRow = {
  id: "22222222-2222-2222-2222-222222222222",
  patientId: patient.id,
  medicalCaseId: null,
  encounterId: null,
  status: "active",
  effectiveFrom: null,
  effectiveTo: null,
  sourceType: "lsevin_coordinator",
  sourceId: null,
  verificationStatus: "unverified",
  providerId: null,
  organizationId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  version: 1,
  code: null,
  codingSystem: null,
  displayName: "Type 2 diabetes",
  patientEnteredName: null,
  clinicalStatus: "active",
  severity: null,
  bodySite: null,
  onsetDate: "2020-01-01",
  resolvedDate: null,
  notes: null,
};

describe("FHIR mapping (V7.1)", () => {
  it("maps a patient to a structurally valid FHIR Patient resource", () => {
    const resource = toFhirPatient(patient, []);
    expect(resource.resourceType).toBe("Patient");
    expect(resource.id).toBe(patient.id);
    expect(validateFhirResource(resource).valid).toBe(true);
  });

  it("degrades a condition's code to text-only when no terminology mapping is curated", () => {
    const resource = toFhirCondition(condition, null);
    expect(resource.code).toEqual({ text: "Type 2 diabetes" });
  });

  it("includes a coding alongside the original text when a terminology mapping IS curated (spec V7.2: preserve source text even when a standard code exists)", () => {
    const resource = toFhirCondition(condition, { targetSystem: "icd10", targetCode: "E11", targetDisplay: "Type 2 diabetes mellitus" });
    const code = resource.code as { coding?: { system?: string; code?: string }[]; text?: string };
    expect(code.text).toBe("Type 2 diabetes");
    expect(code.coding?.[0]?.system).toBe("http://hl7.org/fhir/sid/icd-10");
    expect(code.coding?.[0]?.code).toBe("E11");
  });

  it("every mapped resource passes the structural validity check", () => {
    expect(validateFhirResource(toFhirCondition(condition)).valid).toBe(true);
  });

  it("builds a Bundle whose total matches the entry count", () => {
    const bundle = buildPatientBundle([toFhirPatient(patient, []), toFhirCondition(condition)]);
    expect(bundle.resourceType).toBe("Bundle");
    expect(bundle.total).toBe(2);
    expect(bundle.entry).toHaveLength(2);
  });
});
