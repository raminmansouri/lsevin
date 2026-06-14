import { useState } from "react";
import { toast } from "sonner";

import { ActionState, FieldErrors } from "@/lib/safe-action";
import { IProblem } from "@/types/error";

type Action<TInput, TOutput> = (
  data: TInput
) => Promise<ActionState<TInput, TOutput>>;

interface UseActionOptions<TOutput> {
  onSuccess?: (data?: TOutput) => void;
  onError?: (error: IProblem) => void;
  onComplete?: () => void;
  onBeforeAction?: () => Promise<void> | void;
  onAfterAction?: () => Promise<void> | void;
  startTransition: React.TransitionStartFunction;
}

const useAction = <TInput, TOutput>(
  action: Action<TInput, TOutput>,
  options: UseActionOptions<TOutput> = {
    startTransition: () => {},
  }
) => {
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<TInput> | undefined
  >(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [data, setData] = useState<TOutput | undefined>(undefined);

  const execute = async (input: TInput) => {
    options.startTransition(async () => {
      try {
        // Run pre-operation if provided
        if (options.onBeforeAction) {
          await options.onBeforeAction();
        }

        const result = await action(input);
        if (!result) {
          return;
        }

        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          const fieldErrors = result.fieldErrors as Record<string, string[]>;
          const errorMessage =
            Object.values(fieldErrors)[0]?.[0] ?? "An error occurred";
          setError(errorMessage);
          if (options.onError) {
            options.onError({
              title: errorMessage,
              status: 400,
            });
          } else {
            toast.error(errorMessage);
          }
          return;
        }

        if (result.error) {
          const errorMessage = result.error.errors
            ? Object.values(result.error.errors)[0]?.[0]
            : result.error.detail
              ? `${result.error.title}: ${result.error.detail}`
              : (result.error.title ?? "An error occurred");
          setError(errorMessage);
          if (options.onError) {
            options.onError(result.error);
          } else {
            toast.error(errorMessage);
          }
          return;
        }
        if (result.data) {
          setData(result.data);
          options.onSuccess?.(result.data);
          return;
        }
        options.onSuccess?.();
      } catch (error) {
        console.log("error", error);
        const problem: IProblem = {
          title: "An error occurred",
          status: 500,
          detail: "An error occurred",
        };
        setError(problem.detail || problem.title);
        options.onError?.(problem);
      } finally {
        // Run post-operation if provided
        if (options.onAfterAction) {
          try {
            await options.onAfterAction();
          } catch (error) {
            console.error("Error in onAfterAction:", error);
          }
        }

        options.onComplete?.();
      }
    });
  };

  return {
    execute,
    fieldErrors,
    error,
    data,
  };
};

export default useAction;
