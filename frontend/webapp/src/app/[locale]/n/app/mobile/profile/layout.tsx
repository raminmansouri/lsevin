import { RouteMessages } from "@/app/[locale]/n/route-messages";
import { privateMetadata } from "@/lib/seo/robots-policy";

export const metadata = privateMetadata;

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <RouteMessages route="n/app/mobile/profile" locale={locale}>
      {children}
    </RouteMessages>
  );
}
