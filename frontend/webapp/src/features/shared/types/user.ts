import { Address, Gender } from "./common";

export interface ICurrentUser {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  phoneNumberCountryCode: string;
  birthDate?: string;
  address?: Address;
  gender?: Gender;
}
export enum DocumentType {
  Passport = 1,
  Visa = 2,
  DriverLicense = 3,
  BankStatement = 4,
  IdCard = 5,
  Medical = 6,
  Beauty = 7,
  Tourism = 8,
  Other = 9,
}

export const DocumentTypeStringMap = {
  [DocumentType.Passport]: "Passport",
  [DocumentType.Visa]: "Visa",
  [DocumentType.DriverLicense]: "DriverLicense",
  [DocumentType.BankStatement]: "BankStatement",
  [DocumentType.IdCard]: "IdCard",
  [DocumentType.Medical]: "Medical",
  [DocumentType.Beauty]: "Beauty",
  [DocumentType.Tourism]: "Tourism",
  [DocumentType.Other]: "Other",
};

export const DocumentTypeValueMap = {
  Passport: DocumentType.Passport,
  Visa: DocumentType.Visa,
  DriverLicense: DocumentType.DriverLicense,
  BankStatement: DocumentType.BankStatement,
  IdCard: DocumentType.IdCard,
  Medical: DocumentType.Medical,
  Beauty: DocumentType.Beauty,
  Tourism: DocumentType.Tourism,
  Other: DocumentType.Other,
};

export interface IUserDocuments {
  id: string;
  type: DocumentType;
  url: string;
}
