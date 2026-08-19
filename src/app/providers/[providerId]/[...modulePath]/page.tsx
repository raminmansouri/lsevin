import { ModuleHost } from "@core/modules/ModuleHost";

export default async function ProviderWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ providerId: string; modulePath?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ providerId, modulePath }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  return (
    <ModuleHost
      modulePath={["providers", providerId, ...(modulePath ?? [])]}
      searchParams={resolvedSearchParams}
      shell={false}
    />
  );
}
