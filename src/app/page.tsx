import { ModuleHost } from "@core/modules/ModuleHost";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ModuleHost modulePath={[]} searchParams={await searchParams} />;
}
