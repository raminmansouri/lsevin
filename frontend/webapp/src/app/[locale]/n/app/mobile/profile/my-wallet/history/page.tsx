import { getWalletHistoryPageDataAction } from "../actions";
import TransactionsPageClient from "./TransactionsPageClient";

export default async function WalletHistoryPage() {
  const data = await getWalletHistoryPageDataAction();
  return <TransactionsPageClient initialData={data} />;
}
