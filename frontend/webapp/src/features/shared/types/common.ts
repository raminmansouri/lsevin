import { CountryCode } from "libphonenumber-js";

import { Coordinates } from "./coordinates";
import { LocalizedContent } from "./localization";

export type ParsedPhone = {
  value: string;
  country: CountryCode;
};

export type Address = {
  country: string;
  city: string;
  street?: LocalizedContent;
  detail?: LocalizedContent;
  zipCode?: string;
  coordinates?: Coordinates;
};

export enum Gender {
  Male = 1,
  Female = 2,
  Other = 3,
}

export const GenderStringMap = {
  [Gender.Male]: "Male",
  [Gender.Female]: "Female",
  [Gender.Other]: "Other",
};

export const GenderValueMap = {
  Male: Gender.Male,
  Female: Gender.Female,
  Other: Gender.Other,
};

export type AdminSidebarItemType = {
  title: string;
  url: string;
  items?: AdminSidebarItemType[];
};

export interface IAttribute {
  id: string;
  attributeName: string;
  value: string;
}

export interface IPolicy {
  id: string;
  policyTypeName: string;
  description: string;
}

export interface IGallery {
  id: string;
  title: string;
  url: string;
  mediaType: string;
  displayOrder: number;
}
