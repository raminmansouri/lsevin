import { Locale } from "next-intl";

export type BaseRequest = {
  locale: Locale;
  token?: string;
  userId?: string;
};

export type RequestAuthParams = {
  redirectToLogin?: boolean;
  adminRequired?: boolean;
};

export enum UserRole {
  Admin = "admin",
  User = "user",
}

export type LocaleTypes = "fa" | "en" | "tr" | "es" | "ar" | "ku" | "de" | "fr";
export type LocaleHeaderTypes =
  | "fa-IR"
  | "en-US"
  | "tr-TR"
  | "es-ES"
  | "ar-SA"
  | "ku-KU"
  | "de-DE"
  | "fr-FR";
