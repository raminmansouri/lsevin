import { redirect } from "next/navigation";

type Props = { params: Promise<{ sliderId: string }> };

const SponsoredSliderUpdateAliasPage = async ({ params }: Props) => {
  const { sliderId } = await params;
  redirect(`/admin/sponsered-slider/${sliderId}/update`);
};

export default SponsoredSliderUpdateAliasPage;
