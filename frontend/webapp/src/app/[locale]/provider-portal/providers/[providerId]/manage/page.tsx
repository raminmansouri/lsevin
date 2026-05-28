import { redirect } from "next/navigation";

export default async function ProviderManageIndexPage({
  params,
}: {
  params: Promise<{ locale: string; providerId: string }>;
}) {
  const { locale, providerId } = await params;
  redirect(
    "/" +
      locale +
      "/provider-portal/providers/" +
      providerId +
      "/manage/services",
  );
}
