import { composeE164 } from "./schemas";

export type ConsultationAccountContact = {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  phoneNumberCountryCode?: string | null;
  email?: string | null;
};

export function consultationContactFromAccount(
  user?: ConsultationAccountContact | null
) {
  const firstName = user?.firstName?.trim() || "";
  const lastName = user?.lastName?.trim() || "";
  const phone = composeE164(user?.phoneNumber, user?.phoneNumberCountryCode);
  const email = user?.email?.trim() || "";
  return {
    firstName,
    lastName,
    phone,
    email,
    needsFirstName: !firstName,
    needsLastName: !lastName,
    needsPhone: !phone,
    needsEmail: !email,
  };
}
