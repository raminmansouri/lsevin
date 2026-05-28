import Link from 'next/link';
import { Banknote, ReceiptText, WalletCards } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProviderCommercialDashboard } from '@/features/provider-commercial/server/repository';

export default async function ProviderCommercialDashboardPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = await params;
  const data = await getProviderCommercialDashboard(providerId);
  const cards = [
    { href: `./commercial/ledgers`, title: 'Ledger', icon: Banknote, body: 'Track earnings, reversals, and paid ledger rows.' },
    { href: `./commercial/refunds`, title: 'Refunds', icon: ReceiptText, body: 'Review refund requests raised against this provider.' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Provider commercial operations</h1>
        <p className="text-sm text-muted-foreground">{data.provider?.name ?? providerId} — earnings, refund requests, and booking payment visibility.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader><CardTitle>Open amount</CardTitle></CardHeader><CardContent>{Number(data.open_amount ?? 0).toFixed(2)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Paid amount</CardTitle></CardHeader><CardContent>{Number(data.paid_amount ?? 0).toFixed(2)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Requested refunds</CardTitle></CardHeader><CardContent>{data.requested_refunds ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Approved refunds</CardTitle></CardHeader><CardContent>{data.approved_refunds ?? 0}</CardContent></Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle className="text-base">{card.title}</CardTitle><Icon className="h-5 w-5 text-muted-foreground" /></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{card.body}</p></CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
