import "server-only";

import { z } from "zod/v4";

import { getLocaleHeader } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { LocaleHeaderTypes, RequestAuthParams } from "@/types/common";
import { IProblem } from "@/types/error";

export type FieldErrors<T> = {
  [K in keyof T]?: string[];
};

export type FormErrorType = Record<string, string[] | undefined>;

export type ActionState<TInput, TOutput> = {
  fieldErrors?: FieldErrors<TInput>;
  error?: IProblem;
  data?: TOutput;
  payload?: TInput;
  locale?: LocaleHeaderTypes;
};

export type AuthenticatedActionState<TInput, TOutput> = ActionState<
  TInput,
  TOutput
> & {
  token?: string;
  userId?: string;
};

export type GenericActionProps<TInput> = {
  error?: string;
  onSubmit: (data: TInput) => Promise<void>;
};

export const createSafeFormDataAction = <TInput, TOutput>(
  schema: z.Schema<TInput>,
  handler: (
    validatedData: TInput,
    locale: LocaleHeaderTypes
  ) => Promise<ActionState<TInput, TOutput>>
) => {
  return async (
    state: ActionState<TInput, TOutput> | undefined,
    formData: FormData
  ): Promise<ActionState<TInput, TOutput>> => {
    const payload = Object.fromEntries(formData.entries()) as TInput;

    const validationResult = schema.safeParse(payload);
    if (!validationResult.success) {
      const flattenedErrors = z.flattenError(validationResult.error);
      return {
        ...state,
        error: undefined,
        fieldErrors: flattenedErrors.fieldErrors as FieldErrors<TInput>,
        payload,
      };
    }
    const locale = await getLocaleHeader();
    return handler(validationResult.data, locale);
  };
};

export function createSafeFormAction<TInput, TOutput>(
  schema: z.Schema<TInput>,
  handler: (
    validatedData: TInput,
    locale: LocaleHeaderTypes
  ) => Promise<ActionState<TInput, TOutput>>
) {
  return async (
    _: ActionState<TInput, TOutput> | undefined,
    data: TInput
  ): Promise<ActionState<TInput, TOutput>> => {
    return handleValidation(schema, data, handler);
  };
}

export function createSafeAction<TInput, TOutput>(
  schema: z.Schema<TInput>,
  handler: (
    validatedData: TInput,
    locale: LocaleHeaderTypes
  ) => Promise<ActionState<TInput, TOutput>>
) {
  return async (data: TInput): Promise<ActionState<TInput, TOutput>> => {
    return handleValidation(schema, data, handler);
  };
}

export function createAuthenticatedSafeFormAction<TInput, TOutput>(
  schema: z.Schema<TInput>,
  handler: (
    validatedData: TInput,
    token: string,
    userId: string,
    locale: LocaleHeaderTypes
  ) => Promise<AuthenticatedActionState<TInput, TOutput>>,
  options: RequestAuthParams = {
    redirectToLogin: true,
    adminRequired: false,
  }
) {
  return async (
    _: AuthenticatedActionState<TInput, TOutput> | undefined,
    data: TInput
  ): Promise<AuthenticatedActionState<TInput, TOutput>> => {
    return handleAuthentication(schema, data, handler, options);
  };
}

export function createAuthenticatedSafeAction<TInput, TOutput>(
  schema: z.Schema<TInput>,
  handler: (
    validatedData: TInput,
    token: string,
    userId: string,
    locale: LocaleHeaderTypes
  ) => Promise<AuthenticatedActionState<TInput, TOutput>>,
  options: RequestAuthParams = {
    redirectToLogin: true,
    adminRequired: false,
  }
) {
  return async (
    data: TInput
  ): Promise<AuthenticatedActionState<TInput, TOutput>> => {
    return handleAuthentication(schema, data, handler, options);
  };
}

async function handleValidation<TInput, TOutput>(
  schema: z.Schema<TInput>,
  data: TInput,
  handler: (
    validatedData: TInput,
    locale: LocaleHeaderTypes
  ) => Promise<ActionState<TInput, TOutput>>
): Promise<ActionState<TInput, TOutput>> {
  const validationResult = schema.safeParse(data);
  if (!validationResult.success) {
    const flattenedErrors = z.flattenError(validationResult.error);
    const fieldErrors = flattenedErrors.fieldErrors as FieldErrors<TInput>;
    return {
      fieldErrors,
      payload: data,
    };
  }
  const locale = await getLocaleHeader();
  return handler(validationResult.data, locale);
}

async function handleAuthentication<TInput, TOutput>(
  schema: z.Schema<TInput>,
  data: TInput,
  handler: (
    validatedData: TInput,
    token: string,
    userId: string,
    locale: LocaleHeaderTypes
  ) => Promise<AuthenticatedActionState<TInput, TOutput>>,
  options: RequestAuthParams = {
    redirectToLogin: true,
    adminRequired: false,
  }
): Promise<AuthenticatedActionState<TInput, TOutput>> {
  try {
    const session = await getSession({
      redirectToLogin: options.redirectToLogin,
      adminRequired: options.adminRequired,
    });
    const user = session?.user;

    if (!user?.accessToken || !user?.id) {
      return {
        error: {
          status: 401,
          title: "Unauthorized",
          detail: "Authentication required",
        },
        payload: data,
      };
    }

    const validationResult = schema.safeParse(data);
    if (!validationResult.success) {
      const flattenedErrors = z.flattenError(validationResult.error);
      const fieldErrors = flattenedErrors.fieldErrors as FieldErrors<TInput>;
      return {
        fieldErrors,
        payload: data,
        token: user.accessToken,
        userId: user.id,
      };
    }

    const locale = await getLocaleHeader();
    return handler(validationResult.data, user.accessToken, user.id, locale);
  } catch (error) {
    return {
      error: {
        status: 401,
        title: "Unauthorized",
        detail:
          error instanceof Error ? error.message : "Authentication failed",
      },
      payload: data,
    };
  }
}
