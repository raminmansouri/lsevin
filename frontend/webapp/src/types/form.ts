import { IProblem } from "./error";

export type FormErrorType = Record<string, string[] | undefined>;

export type GenericFormActionType = {
  error?: IProblem;
  fieldErrors?: FormErrorType;
  dispatch?: (payload: FormData) => void;
};
