import { RouteMessages } from "@/app/[locale]/n/route-messages";
import { searchMetadata } from "@/lib/seo/robots-policy";

export const metadata = searchMetadata;

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <RouteMessages route="n/app/mobile/bookings" locale={locale}>
      {children}
    </RouteMessages>
  );
}
