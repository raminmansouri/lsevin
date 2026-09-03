import { getWalletHistoryPageDataAction } from "../actions";
import TransactionsPageClient from "./TransactionsPageClient";

export const dynamic = "force-dynamic";

export default async function WalletHistoryPage() {
  const data = await getWalletHistoryPageDataAction();
  return <TransactionsPageClient initialData={data} />;
}
