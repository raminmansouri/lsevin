import axios, {
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponse,
} from "axios";

import { logout } from "@/features/auth/actions/logout";
import { ApiError } from "@/types/error";

import { errorHandler, networkErrorStrategy } from "./http-error-strategies";
<<<<<<< HEAD
import {
  logAxiosError,
  logAxiosRequest,
  logAxiosResponse,
} from "./logAxios";
=======
import { logAxiosError, logAxiosRequest } from "./logAxios";
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965

const httpService = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

httpService.interceptors.request.use(
  (config) => {
<<<<<<< HEAD
    try {
      logAxiosRequest(config, {
        enabled: true,
        format: "curl",
      });
    } catch {}
    return config;
  },
  (error) => {
    logAxiosError(error);
    return Promise.reject(error);
  }
);

httpService.interceptors.response.use(
  (response) => {
    try {
      logAxiosResponse(response, {
        enabled: true,
      });
    } catch {}
    return response;
=======
    logAxiosRequest(config, {
      enabled: true,
      format: "curl", // "curl" | "node-fetch" | "both"
      // If you want to replay with real tokens, remove "authorization" from redactHeaders
      // redactHeaders: ["cookie", "set-cookie"],
    });
    return config;
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  },
  (error) => {
    logAxiosError(error);
    return Promise.reject(error);
  }
);

httpService.interceptors.response.use(
  (response) => response,
  async (error) => {
    logAxiosError(error, { format: "curl" });

    if (error?.response) {
      const statusCode = error.response.status;

      if (statusCode >= 400) {
        if (statusCode === 401) {
          await logout();
        } else {
          const errorData: ApiError = error.response.data;
          const handler = errorHandler[statusCode];
          if (handler) handler(errorData);
        }
      }
    } else {
      networkErrorStrategy();
    }

<<<<<<< HEAD
=======
    // ⚠️ don’t swallow errors, let callers handle them too
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
    return Promise.reject(error);
  }
);

async function apiBase<T>(
  url: string,
  options?: AxiosRequestConfig
): Promise<T> {
  console.log('urllll:',httpService.getUri())
  ;

  const response: AxiosResponse = await httpService(url, options);
  return response.data as T;
}

async function readData<T>(
  url: string,
  headers?: AxiosRequestHeaders 
): Promise<T> {
  const options: AxiosRequestConfig = {
    headers,
    method: "GET",
  };
<<<<<<< HEAD

=======
  console.log('trying:....',url,options)
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  return await apiBase<T>(url, options);
}

async function postData<TModel, TResult>(
  url: string,
  data: TModel,
  headers?: AxiosRequestHeaders
): Promise<TResult> {
  const options: AxiosRequestConfig = {
    method: "POST",
    headers,
    data: JSON.stringify(data),
  };

  return await apiBase<TResult>(url, options);
}

async function putData<TModel, TResult>(
  url: string,
  data: TModel,
  headers?: AxiosRequestHeaders
): Promise<TResult> {
  const options: AxiosRequestConfig = {
    method: "PUT",
    headers,
    data: JSON.stringify(data),
  };

  return await apiBase<TResult>(url, options);
}

async function deleteData(
  url: string,
  headers?: AxiosRequestHeaders
): Promise<void> {
  const options: AxiosRequestConfig = {
    method: "DELETE",
    headers,
  };

  return await apiBase(url, options);
}

export { readData, postData, putData, deleteData };