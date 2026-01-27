interface IProblem {
  title: string;
  status: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

type IBadRequestError = IProblem;
interface IUnauthorizedError extends IProblem {}
interface IAccessDeniedError extends IProblem {}
type IValidationError = IProblem;
type INotFoundError = IProblem;
type IConflictError = IProblem;
type IUnhandledException = IProblem;
type INetworkError = IProblem;
type ApiError =
  | IBadRequestError
  | IUnauthorizedError
  | IAccessDeniedError
  | IValidationError
  | INotFoundError
  | IUnhandledException;

export type {
  IProblem,
  IBadRequestError,
  IUnauthorizedError,
  IAccessDeniedError,
  IValidationError,
  INotFoundError,
  IConflictError,
  IUnhandledException,
  INetworkError,
  ApiError,
};
