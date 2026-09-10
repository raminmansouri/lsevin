import { getTranslations } from "next-intl/server";
import Link from 'next/link';
import { Banknote, WalletCards, ReceiptText, Scale } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminCommercialDashboardSummary } from '@/features/commercial/api/server/get-admin-commercial';

export default async function CommercialDashboardPage() {
  const t = await getTranslations("AdminPages");
  const summary = await getAdminCommercialDashboardSummary();
  const cards = [
    { href: '/admin/commercial/policies', title: 'Compensation policies', icon: Scale, body: 'Provider/platform revenue split rules.' },
    { href: '/admin/commercial/payment-policies', title: 'Payment policies', icon: WalletCards, body: 'Free booking, deposit, and full-prepay rules.' },
    { href: '/admin/commercial/provider-ledgers', title: 'Provider ledger', icon: Banknote, body: 'Track provider earnings, reversals, and settlement state.' },
    { href: '/admin/commercial/refund-requests', title: 'Refund requests', icon: ReceiptText, body: 'Review, approve, reject, and execute booking refunds.' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("commercialOperations")}</h1>
        <p className="text-sm text-muted-foreground">{t("compensationBookingPaymentCollectionProviderLedgersAndRefunds")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">{card.title}</CardTitle>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{card.body}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      {summary ? (
        <Card>
          <CardHeader><CardTitle>{t("snapshot")}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4 text-sm">
            <div><div className="text-muted-foreground">{t("policies")}</div><div className="font-medium">{summary.policyCount ?? '—'}</div></div>
            <div><div className="text-muted-foreground">{t("pendingLedgers")}</div><div className="font-medium">{summary.pendingLedgerCount ?? '—'}</div></div>
            <div><div className="text-muted-foreground">{t("requestedRefunds")}</div><div className="font-medium">{summary.requestedRefundCount ?? '—'}</div></div>
            <div><div className="text-muted-foreground">{t("approvedRefunds")}</div><div className="font-medium">{summary.approvedRefundCount ?? '—'}</div></div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
