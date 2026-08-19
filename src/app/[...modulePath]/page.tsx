import { ModuleHost } from "@core/modules/ModuleHost";

export const dynamic = "force-dynamic";

export default async function ModularPage({ params, searchParams }: { params: Promise<{ modulePath?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ modulePath }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  return <ModuleHost modulePath={modulePath} searchParams={resolvedSearchParams} />;
}
