import axios, {
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponse,
} from "axios";

import { logout } from "@/features/auth/actions/logout";
import { ApiError } from "@/types/error";

import { errorHandler, networkErrorStrategy } from "./http-error-strategies";
import {
  logAxiosError,
  logAxiosRequest,
  logAxiosResponse,
} from "./logAxios";

const httpService = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

httpService.interceptors.request.use(
  (config) => {
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
  },
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

    return Promise.reject(error);
  }
);

async function apiBase<T>(
  url: string,
  options?: AxiosRequestConfig
): Promise<T> {
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