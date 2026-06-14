import {
  defaultShouldDehydrateQuery,
  isServer,
  MutationCache,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { formatError } from "@/lib/formatters";
import { IProblem } from "@/types/error";

let browserQueryClient: QueryClient | undefined = undefined;

const handleAuthError = () => {
  // Since we can't use useClerk here, redirect the user
  window.location.href = "/sign-in";
};

const makeQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error: unknown) => {
        const problem = error as IProblem;
        if (problem?.status === 401) {
          handleAuthError();
          return;
        }
        const errorMessage = formatError(problem);
        toast.error(errorMessage);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error: unknown) => {
        const err = error as IProblem;
        if (err?.status === 401) {
          handleAuthError();
          return;
        }

        const errorMessage = formatError(err);
        if (err) toast.error(errorMessage);
      },
    }),
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        throwOnError: false,
        gcTime: 1000 * 60 * 60 * 24,
      },
      dehydrate: {
        // include pending queries in dehydration
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });

export const getQueryClient = () => {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
};
