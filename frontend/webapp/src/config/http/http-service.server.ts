import "server-only";

import { getLocale } from "next-intl/server";

import { getSession } from "@/lib/auth/session";
import { RequestAuthParams } from "@/types/common";
import { IProblem } from "@/types/error";
import { ApiReturnType } from "@/types/network";

import { env } from "../env/client";
import {
  DEFAULT_LOCALE_HEADER,
  isSupportedLocale,
  localeToHeader,
} from "../locales";
import { errorHandler } from "./http-error-strategies";
import { logRequest } from "./logger";

type KeyValue = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

type PrimitiveValue = string | number | boolean | null | undefined;
type ApiDataValue = KeyValue | PrimitiveValue;
type ParamsDictionary = {
  [key: string]: string | number | boolean;
};

type FetcherOptions = {
  method?: "POST" | "GET" | "PUT" | "DELETE" | "PATCH";
  headers?: HeadersInit;
  params?: ParamsDictionary;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
  cache?: RequestCache;
  tags?: string[] | undefined;
  revalidate?: number | false | undefined;
  token?: string;
  locale?: string;
  isFormData?: boolean;
};

const getAuthHeaders = (token?: string): HeadersInit | null => {
  if (!token) {
    return null;
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const prepareRequest = async (
  url: URL,
  options: FetcherOptions
): Promise<RequestInit> => {
  let body: string | FormData | undefined;
  // Start with default headers
  const requestHeaders: HeadersInit = new Headers({
    Accept: "application/json",
    "Accept-Language": options.locale ?? "fa-IR",
    ...options.headers,
  });
  // Add Content-Type header only if it's not FormData
  if (!options.isFormData) {
    requestHeaders.set("Content-Type", "application/json");
  }

  // Add auth headers if not skipped
  const authHeaders = getAuthHeaders(options.token);
  if (authHeaders) {
    Object.entries(authHeaders).forEach(([key, value]) => {
      requestHeaders.set(key, value);
    });
  }

  if (options.params) {
    Object.keys(options.params).forEach((key) => {
      if (options.params![key] !== undefined) {
        url.searchParams.append(key, String(options.params![key]));
      }
    });
  }

  if (options.payload) {
    if (options.isFormData) {
      // Use FormData directly as the body
      body = options.payload as FormData;
    } else {
      // Stringify JSON payload
      body = JSON.stringify(options.payload);
    }
  }

  return {
    method: options.method,
    headers: requestHeaders,
    body,
    cache: options.cache ?? "default",
    ...((options.tags || options.revalidate) && {
      next: { tags: options.tags, revalidate: options.revalidate },
    }),
  };
};

const customFetch = async <TResult extends ApiDataValue>(
  url: string,
  options: FetcherOptions
): Promise<ApiReturnType<TResult>> => {
    const finalUrl = new URL(`${env.NEXT_PUBLIC_API_URL}/${url}`);
  try {
    const fetchOptions = await prepareRequest(finalUrl, options);

    // 🔥 LOG IT (copy/paste runnable)
    logRequest(finalUrl.toString(), fetchOptions, fetchOptions.body as any, {
      enabled: true,
      format: "both", // "curl" | "node-fetch" | "both"
      // If you want to see the real token, remove "authorization" from redactHeaders
      // redactHeaders: ["cookie", "set-cookie"], 
    });

    const response = await fetch(finalUrl, fetchOptions);
    return await handleFetchApiResponse<TResult>(finalUrl?.toString(),response);
  } catch (error: unknown) {
    console.log(finalUrl.toString(),error);
    const err = error as IProblem;
    if (err) {
      const problem: IProblem = {
        url:finalUrl.toString(),
        title: err?.title ?? "مشکلی رخ داده است",
        status: err?.status ?? 500,
        detail: err?.detail ?? "مشکلی رخ داده است",
        err: err,
        errors: err?.errors,
      };
      return { error: problem };
    }
    throw new Error("مشکلی رخ داده است");
  }
};

// CRUD Operations with optional auth
export const readData = <TResult extends ApiDataValue>(
  url: string,
  options?: FetcherOptions
): Promise<ApiReturnType<TResult>> =>
  customFetch<TResult>(url, { ...options, method: "GET" });

export const postData = <TPayload, TResult extends ApiDataValue>(
  url: string,
  data: TPayload,
  options?: FetcherOptions
): Promise<ApiReturnType<TResult>> => {
  const isFormData = data instanceof FormData;
  return customFetch<TResult>(url, {
    ...options,
    method: "POST",
    payload: data,
    isFormData,
  });
};

export const putData = <TPayload, TResult extends ApiDataValue>(
  url: string,
  data: TPayload,
  options?: FetcherOptions
): Promise<ApiReturnType<TResult>> => {
  const isFormData = data instanceof FormData;
  return customFetch<TResult>(url, {
    ...options,
    method: "PUT",
    payload: data,
    isFormData,
  });
};

export const deleteData = <TPayload, TResult extends ApiDataValue>(
  url: string,
  data?: TPayload,
  options?: FetcherOptions
): Promise<ApiReturnType<TResult>> => {
  const isFormData = data instanceof FormData;
  return customFetch<TResult>(url, {
    ...options,
    method: "DELETE",
    payload: data,
    isFormData,
  });
};

export const patchData = <TPayload, TResult extends ApiDataValue>(
  url: string,
  data?: TPayload,
  options?: FetcherOptions
): Promise<ApiReturnType<TResult>> => {
  const isFormData = data instanceof FormData;
  return customFetch<TResult>(url, {
    ...options,
    method: "PATCH",
    // If no payload is provided for a PATCH request, avoid setting the body
    ...(data !== undefined && { payload: data }),
    isFormData,
  });
};

async function handleFetchApiResponse<TSuccess>(
  finalUrl:string,response: Response
): Promise<ApiReturnType<TSuccess>> {
  // Handle successful responses
  if (response.ok) {
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error("Failed to parse successful response body:", e);
      // Return empty data if we can't parse a successful response
      return { data: {} as TSuccess };
    }
    return { data };
  }

  // Handle error responses
  let error;
  try {
    // Try to read error body (only once!)
    const responseText = await response.text();
    error = responseText ? JSON.parse(responseText) : {};
  } catch (e) {
    // If we can't parse the error response, create a generic error
    console.error("Failed to parse error response:", e);
    error = {
      title: "Error",
      detail: `Request failed with status ${response.status}`,
      errors: {},
    };
  }

  const problem: IProblem = {
    url:finalUrl,
    title: error.title || "Error",
    status: response.status,
    detail: error.detail || error.message || "An error occurred",
    errors: error.errors || {},
  };

  // Check if there's a handler for this status code
  const handler = errorHandler[response.status];
  if (handler) {
    // Handlers throw errors, so this will exit the function
    handler(problem);
  }

  // If no handler, return the error
  return { error: problem };
}

export const withBaseHeaders = async <T>(
  apiCallFn: (locale: string, token?: string, userId?: string) => Promise<T>,
  { redirectToLogin = true, adminRequired = false }: RequestAuthParams = {
    redirectToLogin: true,
    adminRequired: false,
  }
): Promise<T> => {
  const session = await getSession({ redirectToLogin, adminRequired });
  const user = session?.user;

  const locale = await getLocale();
  const lang = isSupportedLocale(locale)
    ? localeToHeader(locale)
    : DEFAULT_LOCALE_HEADER;

  return apiCallFn(lang, user?.accessToken, user?.id);
};



