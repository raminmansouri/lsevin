import { notFound } from "next/navigation";

import { getWalletTransactionDetailAction } from "../../actions";
import TransactionDetailPageClient from "./TransactionDetailPageClient";

interface WalletTransactionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function WalletTransactionDetailPage({
  params,
}: WalletTransactionDetailPageProps) {
  const { id } = await params;
  const detail = await getWalletTransactionDetailAction(id);

  if (!detail) {
    notFound();
  }

  return <TransactionDetailPageClient transaction={detail} />;
}
