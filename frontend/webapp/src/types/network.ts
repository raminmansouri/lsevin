import { IProblem } from "./error";

export type ApiReturnType<T> = {
  data?: T;
  error?: IProblem;
};

export type PaginatedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
  currentStartIndex: number;
  currentEndIndex: number;
  totalPages: number;
};
