import { revalidateTag } from "next/cache";

import { getGlobalTag, getIdTag, getUserTag } from "@/lib/data-cache";

export function getUserGlobalTag() {
  return getGlobalTag("users");
}

export function getUserIdTag(id: string) {
  return getUserTag("users", id);
}

export function revalidateUserCache(id: string) {
  revalidateTag(getUserGlobalTag());
  revalidateTag(getUserTag("users", id));
}

export function getUserDocumentsGlobalTag() {
  return getGlobalTag("user-documents");
}

export function getUserDocumentIdTag(id: string) {
  return getIdTag("user-documents", id);
}

export function getUserDocumentsTag(userId: string) {
  return getUserTag("user-documents", userId);
}

export function revalidateUserDocumentCache(id: string, userId: string) {
  revalidateTag(getUserDocumentsGlobalTag());
  revalidateTag(getUserDocumentIdTag(id));
  revalidateTag(getUserDocumentsTag(userId));
}
