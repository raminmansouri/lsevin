import { displayTranslation, joinCsv } from "./normalizers";
import type {
  ProviderAddonOption,
  ProviderPolicyTypeOption,
  ProviderServiceRow,
  ServiceDefinitionOption,
  StaffRow,
} from "../types";

export function tr(
  value: Record<string, string> | null | undefined,
  locale = "fa-IR",
) {
  return displayTranslation(value || {}, locale, "");
}

export function csv(value: string[] | null | undefined) {
  return joinCsv(value || []);
}

export function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  return normalized.slice(0, 16);
}

export function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function toTimeInput(value: string | null | undefined) {
  if (!value) return "";
  const clean = value.replace(/^PT/i, "");
  if (clean.includes(":")) return clean.slice(0, 5);
  return clean.slice(0, 5);
}

export function serviceDefinitionOptions(
  definitions: ServiceDefinitionOption[],
) {
  return definitions.map((item) => ({ value: item.id, label: item.label }));
}

export function providerServiceOptions(services: ProviderServiceRow[]) {
  return services.map((item) => ({ value: item.id, label: item.name }));
}

export function staffOptions(staff: StaffRow[]) {
  return staff.map((item) => ({ value: item.id, label: item.displayName }));
}

export function policyTypeOptions(policyTypes: ProviderPolicyTypeOption[]) {
  return policyTypes.map((item) => ({
    value: item.id,
    label: item.label || item.code,
  }));
}

export function addonOptions(addons: ProviderAddonOption[]) {
  return addons.map((item) => ({
    value: item.id,
    label: `${item.name} (${item.currencyCode} ${item.price})`,
  }));
}

export function providerPortalBack(providerId: string, suffix: string) {
  return `/provider-portal/providers/${providerId}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
}
