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
  SuperAdmin = "superadmin",
  Admin = "admin",
  // Finance roles. An accountant reads the books and works the deposit/withdrawal
  // queues without gaining access to the rest of the admin panel; a finance admin can
  // additionally change the chart of accounts and the settings that decide how much
  // money moves. Both are separate from Admin so that giving someone the books does not
  // give them the platform.
  FinanceAdmin = "financeadmin",
  Accountant = "accountant",
  User = "user",
}

export type LocaleTypes =
  | "fa"
  | "en"
  | "tr"
  | "es"
  | "ar"
  | "ku"
  | "de"
  | "fr"
  | "ru"
  | "tg"
  | "zh";
export type LocaleHeaderTypes =
  | "fa-IR"
  | "en-US"
  | "tr-TR"
  | "es-ES"
  | "ar-SA"
  | "ku-KU"
  | "de-DE"
  | "fr-FR"
  | "ru-RU"
  | "tg-TJ"
  | "zh-CN";
