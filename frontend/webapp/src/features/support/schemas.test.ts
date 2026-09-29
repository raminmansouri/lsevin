import { describe, expect, it } from "vitest";

import {
  AddClinicalRecordFromConversationSchema,
  CreateContextConversationSchema,
  GetOrCreateConversationSchema,
  SendProviderMessageSchema,
  SendRequirementRequestSchema,
} from "./schemas";

const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";
const UUID_C = "33333333-3333-4333-8333-333333333333";

describe("CreateContextConversationSchema", () => {
  const base = { customerUserId: UUID_A, locale: "en-US" };

  it("accepts a booking context with a bookingId", () => {
    const result = CreateContextConversationSchema.safeParse({
      ...base,
      contextType: "booking",
      bookingId: UUID_B,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a consultation context with a consultationRequestId", () => {
    const result = CreateContextConversationSchema.safeParse({
      ...base,
      contextType: "consultation",
      consultationRequestId: UUID_C,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a booking context missing its bookingId", () => {
    const result = CreateContextConversationSchema.safeParse({ ...base, contextType: "booking" });
    expect(result.success).toBe(false);
  });

  it("rejects a consultation context missing its consultationRequestId", () => {
    const result = CreateContextConversationSchema.safeParse({ ...base, contextType: "consultation" });
    expect(result.success).toBe(false);
  });

  it("rejects a booking context that only supplies the consultation anchor", () => {
    const result = CreateContextConversationSchema.safeParse({
      ...base,
      contextType: "booking",
      consultationRequestId: UUID_C,
    });
    expect(result.success).toBe(false);
  });
});

describe("GetOrCreateConversationSchema.source", () => {
  it("still accepts the pre-existing source values", () => {
    for (const source of ["floating_widget", "support_page", "provider_page", "booking", "service_page", "admin_created"]) {
      const result = GetOrCreateConversationSchema.safeParse({
        customerUserId: UUID_A,
        source,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts the newly-added consultation source", () => {
    const result = GetOrCreateConversationSchema.safeParse({
      customerUserId: UUID_A,
      source: "consultation",
    });
    expect(result.success).toBe(true);
  });
});

describe("SendProviderMessageSchema", () => {
  it("requires both providerUserId and providerId", () => {
    const result = SendProviderMessageSchema.safeParse({
      conversationId: UUID_A,
      providerUserId: UUID_B,
      body: "Hello",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed provider message", () => {
    const result = SendProviderMessageSchema.safeParse({
      conversationId: UUID_A,
      providerUserId: UUID_B,
      providerId: UUID_C,
      body: "Hello",
    });
    expect(result.success).toBe(true);
  });
});

describe("SendRequirementRequestSchema", () => {
  it("defaults isMandatory to true", () => {
    const result = SendRequirementRequestSchema.parse({
      conversationId: UUID_A,
      medicalCaseId: UUID_B,
      requirementType: "document",
      title: "Recent blood test",
    });
    expect(result.isMandatory).toBe(true);
  });

  it("rejects a missing title", () => {
    const result = SendRequirementRequestSchema.safeParse({
      conversationId: UUID_A,
      medicalCaseId: UUID_B,
      requirementType: "document",
      title: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("AddClinicalRecordFromConversationSchema", () => {
  it("accepts every recordType the structured-actions dispatcher handles", () => {
    for (const recordType of ["condition", "allergy", "medication", "procedure"] as const) {
      const result = AddClinicalRecordFromConversationSchema.safeParse({
        conversationId: UUID_A,
        patientId: UUID_B,
        recordType,
        payload: {},
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects an unknown recordType", () => {
    const result = AddClinicalRecordFromConversationSchema.safeParse({
      conversationId: UUID_A,
      patientId: UUID_B,
      recordType: "diagnosis",
      payload: {},
    });
    expect(result.success).toBe(false);
  });
});
