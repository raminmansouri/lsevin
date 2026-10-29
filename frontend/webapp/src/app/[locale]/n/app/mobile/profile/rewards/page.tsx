import RewardsClient from "./RewardsClient";
import { getRewardsPageData } from "./rewards.data";
import { DesktopRewardsView } from "@/features/web-desktop/rewards/DesktopRewardsView";


export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = await getRewardsPageData(locale);
  return (
    <>
      <div className="xl:hidden">
        <RewardsClient data={data} />
      </div>
      <DesktopRewardsView data={data} />
    </>
  );
}
