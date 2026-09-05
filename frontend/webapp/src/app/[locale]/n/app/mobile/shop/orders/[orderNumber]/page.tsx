import { redirect } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function LegacyOrderDetailRedirect({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
}) {
  const { locale, orderNumber } = await params;
  redirect({ href: `/n/app/mobile/shop/order/${orderNumber}`, locale });
}
