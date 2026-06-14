type CACHE_TAG =
  | "users"
  | "user-documents"
  | "consulting"
  | "home-page"
  | "service-providers"
  | "service-provider-requests"
  | "service-provider-comments"
  | "categories"
  | "bookings"
  | "provider-types"
  | "service-definitions"
  | "staff";

export function getGlobalTag(tag: CACHE_TAG) {
  return `global:${tag}` as const;
}

export function getIdTag(tag: CACHE_TAG, id: string) {
  return `id:${tag}-${id}` as const;
}

export function getUserTag(tag: CACHE_TAG, userId: string) {
  return `user:${tag}-${userId}` as const;
}

export function getServiceProviderTag(
  tag: CACHE_TAG,
  serviceProviderId: string
) {
  return `service-provider:${tag}-${serviceProviderId}` as const;
}
