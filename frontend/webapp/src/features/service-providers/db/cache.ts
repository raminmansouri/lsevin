import { revalidateTag } from "next/cache";

import {
  getGlobalTag,
  getIdTag,
  getServiceProviderTag,
  getUserTag,
} from "@/lib/data-cache";

export function getServiceProviderGlobalTag() {
  return getGlobalTag("service-providers");
}

export function getServiceProviderIdTag(id: string) {
  return getIdTag("service-providers", id);
}


export function getFeaturedServicesTag() {
  return getIdTag("service-providers",'featured-services');
}

export function getTrendingServicesTag() {
  return getIdTag("service-providers",'trending-services');
}


export function getTrustedProvidersTag() {
  return getIdTag("service-providers",'trusted-providers');
}
export function getSearchHistoryTag() {
  return getIdTag("service-providers",'search-history');
}

export function getUserServiceProviderTag(userId: string) {
  return getUserTag("service-providers", userId);
}

export function revalidateServiceProviderCache(id: string, userId: string) {
  revalidateTag(getServiceProviderGlobalTag());
  revalidateTag(getServiceProviderIdTag(id));
  revalidateTag(getUserServiceProviderTag(userId));
}

export function getServiceProviderRequestGlobalTag() {
  return getGlobalTag("service-provider-requests");
}

export function getServiceProviderRequestIdTag(id: string) {
  return getIdTag("service-provider-requests", id);
}

export function getServiceProviderRequestUserTag(userId: string) {
  return getUserTag("service-provider-requests", userId);
}

export function getServiceProviderRequestServiceProviderTag(
  serviceProviderId: string
) {
  return getServiceProviderTag("service-provider-requests", serviceProviderId);
}

export function revalidateServiceProviderRequestCache(
  id?: string,
  userId?: string,
  serviceProviderId?: string
) {
  revalidateTag(getServiceProviderRequestGlobalTag());
  if (id) {
    revalidateTag(getServiceProviderRequestIdTag(id));
  }
  if (userId) {
    revalidateTag(getServiceProviderRequestUserTag(userId));
  }
  if (serviceProviderId) {
    revalidateTag(
      getServiceProviderRequestServiceProviderTag(serviceProviderId)
    );
  }
}

export function getCommentsGlobalTag() {
  return getGlobalTag("service-provider-comments");
}

export function getCommentsIdTag(commentId: string) {
  return getIdTag("service-provider-comments", commentId);
}

export function getUserCommentsTag(userId: string) {
  return getUserTag("service-provider-comments", userId);
}

export function getServiceProviderCommentsTag(serviceProviderId: string) {
  return getIdTag("service-provider-comments", `provider-${serviceProviderId}`);
}

export function revalidateCommentsCache(
  serviceProviderId?: string,
  userId?: string,
  commentId?: string
) {
  revalidateTag(getCommentsGlobalTag());
  if (serviceProviderId) {
    revalidateTag(getServiceProviderCommentsTag(serviceProviderId));
  }
  if (userId) {
    revalidateTag(getUserCommentsTag(userId));
  }
  if (commentId) {
    revalidateTag(getCommentsIdTag(commentId));
  }
}
