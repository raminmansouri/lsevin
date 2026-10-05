import { describe, expect, it } from "vitest";

import { consultationContactFromAccount } from "./consultation-contact";

describe("consultationContactFromAccount", () => {
  it("reuses complete signed-in account details without asking for them again", () => {
    expect(
      consultationContactFromAccount({
        firstName: " Sara ",
        lastName: "Ahmadi",
        phoneNumber: "9123456789",
        phoneNumberCountryCode: "IR",
        email: " sara@example.com ",
      })
    ).toEqual({
      firstName: "Sara",
      lastName: "Ahmadi",
      phone: "+989123456789",
      email: "sara@example.com",
      needsFirstName: false,
      needsLastName: false,
      needsPhone: false,
      needsEmail: false,
    });
  });

  it("asks only for account fields that are missing", () => {
    expect(
      consultationContactFromAccount({
        firstName: "Sara",
        phoneNumber: "5063565571",
        phoneNumberCountryCode: "TR",
      })
    ).toMatchObject({
      phone: "+905063565571",
      needsFirstName: false,
      needsLastName: true,
      needsPhone: false,
      needsEmail: true,
    });
  });
});
