import { beforeEach, describe, expect, it, vi } from "vitest";

const addCaseRequirement = vi.fn();
const addPatientCondition = vi.fn();
const addPatientAllergy = vi.fn();
const addPatientMedication = vi.fn();
const addPatientProcedure = vi.fn();
const insertStructuredMessage = vi.fn();

vi.mock("@/features/patients/server/cases-repository", () => ({ addCaseRequirement }));
vi.mock("@/features/patients/server/clinical-repository", () => ({
  addPatientCondition,
  addPatientAllergy,
  addPatientMedication,
  addPatientProcedure,
}));
vi.mock("./repository", () => ({ insertStructuredMessage }));

const { requestFileInConversation, addClinicalRecordFromConversation } = await import("./structured-actions");

const CONVERSATION_ID = "11111111-1111-4111-8111-111111111111";
const MEDICAL_CASE_ID = "22222222-2222-4222-8222-222222222222";
const PATIENT_ID = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  vi.clearAllMocks();
  insertStructuredMessage.mockImplementation(async (input) => ({ id: "msg-1", ...input }));
});

describe("requestFileInConversation", () => {
  it("creates a real medical_case_requirements row via addCaseRequirement, not a parallel mechanism", async () => {
    addCaseRequirement.mockResolvedValue({ id: "req-1", isMandatory: true });

    await requestFileInConversation({
      conversationId: CONVERSATION_ID,
      medicalCaseId: MEDICAL_CASE_ID,
      requirementType: "document",
      title: "Recent blood test",
      isMandatory: true,
    } as any);

    expect(addCaseRequirement).toHaveBeenCalledWith(
      expect.objectContaining({ medicalCaseId: MEDICAL_CASE_ID, requirementType: "document", title: "Recent blood test" })
    );
    const messageArg = insertStructuredMessage.mock.calls[0][0];
    expect(messageArg.messageType).toBe("requirement_request");
    expect(messageArg.metadata.requirementId).toBe("req-1");
  });

  it("attributes the message to the provider when actorProviderId is present", async () => {
    addCaseRequirement.mockResolvedValue({ id: "req-2", isMandatory: true });

    await requestFileInConversation({
      conversationId: CONVERSATION_ID,
      medicalCaseId: MEDICAL_CASE_ID,
      requirementType: "document",
      title: "Recent blood test",
      actorProviderId: "provider-1",
    } as any);

    expect(insertStructuredMessage.mock.calls[0][0].senderType).toBe("provider");
  });
});

describe("addClinicalRecordFromConversation", () => {
  it.each([
    ["condition", { displayName: "Hypertension" }, addPatientCondition],
    ["allergy", { category: "food", substance: "Peanuts" }, addPatientAllergy],
    ["medication", { name: "Metformin" }, addPatientMedication],
    ["procedure", { procedureName: "Appendectomy", performedFrom: "2020-01-01" }, addPatientProcedure],
  ] as const)("dispatches %s to its matching clinical-repository writer", async (recordType, payload, writer) => {
    writer.mockResolvedValue({ id: "record-1" });

    await addClinicalRecordFromConversation({
      conversationId: CONVERSATION_ID,
      medicalCaseId: MEDICAL_CASE_ID,
      patientId: PATIENT_ID,
      recordType,
      payload,
    } as any);

    expect(writer).toHaveBeenCalledWith(expect.objectContaining({ patientId: PATIENT_ID }));
    expect(insertStructuredMessage.mock.calls[0][0].messageType).toBe("clinical_record");
  });

  it("rejects a condition payload missing the required displayName", async () => {
    await expect(
      addClinicalRecordFromConversation({
        conversationId: CONVERSATION_ID,
        patientId: PATIENT_ID,
        recordType: "condition",
        payload: {},
      } as any)
    ).rejects.toThrow(/displayName/);
    expect(addPatientCondition).not.toHaveBeenCalled();
  });

  it("rejects a procedure payload missing performedFrom even when procedureName is present", async () => {
    await expect(
      addClinicalRecordFromConversation({
        conversationId: CONVERSATION_ID,
        patientId: PATIENT_ID,
        recordType: "procedure",
        payload: { procedureName: "Appendectomy" },
      } as any)
    ).rejects.toThrow(/performedFrom/);
    expect(addPatientProcedure).not.toHaveBeenCalled();
  });

  it("passes doctor/verified provenance only when the write comes from a provider", async () => {
    addPatientCondition.mockResolvedValue({ id: "record-2" });

    await addClinicalRecordFromConversation({
      conversationId: CONVERSATION_ID,
      patientId: PATIENT_ID,
      recordType: "condition",
      payload: { displayName: "Asthma" },
      actorProviderId: "provider-1",
    } as any);

    expect(addPatientCondition).toHaveBeenCalledWith(
      expect.objectContaining({ sourceType: "doctor", verificationStatus: "verified" })
    );
  });
});
