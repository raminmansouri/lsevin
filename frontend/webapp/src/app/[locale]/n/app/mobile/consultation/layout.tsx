import { RouteMessages } from "@/app/[locale]/n/route-messages";

// Video consultation routes: indexing is left to each page, as before.
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <RouteMessages route="n/app/mobile/consultation" locale={locale}>
      {children}
    </RouteMessages>
  );
}
