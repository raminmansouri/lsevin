import { Suspense } from "react";

import { getWalletPageDataAction } from "./actions";
import WalletPageClient from "./WalletPageClient";

export default async function WalletPage() {
  const data = await getWalletPageDataAction();

  // WalletPageClient reads the gateway's top-up result off the query string with
  // useSearchParams, which Next requires to sit under a Suspense boundary.
  return (
    <Suspense>
      <WalletPageClient initialData={data} />
    </Suspense>
  );
}
