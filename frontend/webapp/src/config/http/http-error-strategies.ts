import {
  IAccessDeniedError,
  IBadRequestError,
  IConflictError,
  INetworkError,
  INotFoundError,
  IProblem,
  IUnauthorizedError,
  IUnhandledException,
  IValidationError,
} from "@/types/error";

export type ApiErrorHandler = (error: IProblem) => void;

export const badRequestErrorStrategy: ApiErrorHandler = (errorData) => {
  throw {
    ...errorData,
  } as IBadRequestError;
};

export const validationErrorStrategy: ApiErrorHandler = (errorData) => {
  throw { ...errorData } as IValidationError;
};

export const unAuthorizedError: ApiErrorHandler = (errorData) => {
  throw {
    ...errorData,
    detail: "شما مجوز انجام این عملیات را ندارید!",
  } as IUnauthorizedError;
};

export const accessDeniedError: ApiErrorHandler = (errorData) => {
  throw {
    ...errorData,
    detail: "شما مجوز انجام این عملیات را ندارید!",
  } as IAccessDeniedError;
};

export const notFoundErrorStrategy: ApiErrorHandler = (errorData) => {
  throw { ...errorData, detail: "آیتم یافت نشد!" } as INotFoundError;
};

export const conflictErrorStrategy: ApiErrorHandler = (errorData) => {
  throw { ...errorData, detail: "آیتم قبلا وجود دارد!" } as IConflictError;
};

export const unhandledExceptionStrategy: ApiErrorHandler = (errorData) => {
  throw { ...errorData, details: "خطای سرور!" } as IUnhandledException;
};

export const networkErrorStrategy = () => {
  throw { status: 0, detail: "خطای شبکه!" } as INetworkError;
};

export const rateLimitErrorStrategy: ApiErrorHandler = (errorData) => {
  console.warn("Rate limited:", errorData);
  // Don't throw for rate limiting, let it be handled gracefully
  return;
};

export const errorHandler: Record<number, ApiErrorHandler> = {
  400: (errorData) =>
    (errorData.errors ? validationErrorStrategy : badRequestErrorStrategy)(
      errorData
    ),
  401: unAuthorizedError,
  403: accessDeniedError,
  404: notFoundErrorStrategy,
  409: conflictErrorStrategy,
  429: rateLimitErrorStrategy, // Handle rate limiting
  500: unhandledExceptionStrategy,
};
