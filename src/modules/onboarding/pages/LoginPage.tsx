import { AuthEntryPage } from "@core/ui/auth/AuthEntryPage";
import type { ModulePageProps } from "@core/modules/types";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function LoginPage({ searchParams }: ModulePageProps) {
  return <AuthEntryPage mode="signin" returnTo={first(searchParams.returnTo)} query={first(searchParams.q)} />;
}

export function RegisterPage({ searchParams }: ModulePageProps) {
  return <AuthEntryPage mode="signup" returnTo={first(searchParams.returnTo)} query={first(searchParams.q)} />;
}
