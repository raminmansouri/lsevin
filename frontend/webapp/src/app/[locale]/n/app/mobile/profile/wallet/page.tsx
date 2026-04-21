import { getWalletPageDataAction } from "./actions";
import WalletPageClient from "./WalletPageClient";

export default async function WalletPage() {
  const data = await getWalletPageDataAction();
  return <WalletPageClient initialData={data} />;
}
