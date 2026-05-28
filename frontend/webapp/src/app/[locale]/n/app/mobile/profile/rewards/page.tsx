import RewardsClient from "./RewardsClient";
import { getRewardsPageData } from "./rewards.data";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = await getRewardsPageData(locale);
  return <RewardsClient data={data} />;
}
