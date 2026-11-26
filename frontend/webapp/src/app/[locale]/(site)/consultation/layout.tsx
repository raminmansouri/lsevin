import { RouteMessages } from "@/app/[locale]/n/route-messages";

// Public consultation pages (/consultation/doctors, ...): the same route
// messages as the app's consultation screens (ROUTE_NAMESPACES).
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <RouteMessages route="(site)/consultation" locale={locale}>
      {children}
    </RouteMessages>
  );
}
