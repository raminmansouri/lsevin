export const TRANSLATION_KEY = "ServiceProvider";
export const SERVICE_PROVIDER_PAGE_TRANSLATION_KEY = "ServiceProviderPage";
export const REQUESTS_TRANSLATION_KEY = "ServiceProviderPage.requests";
export const SERVICE_PROVIDER_COMMENTS_TRANSLATION_KEY =
  "ServiceProviderPage.Comments";

export const SERVICE_PROVIDERS_ROUTES = {
  LIST: "/admin/service-providers",
  ADD: "/admin/service-providers/add",
  UPDATE: (id: string) => `/admin/service-providers/${id}/update`,
} as const;
