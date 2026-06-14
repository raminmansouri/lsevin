import { useSession } from "next-auth/react";

export const useCurrentSession = (required: boolean) => {
  const session = useSession({
    required: required,
  });

  return {
    user: session?.data?.user,
    status: session?.status,
  };
};
