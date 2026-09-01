import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CurrencyActiveToggle } from '@/features/finance/components/admin/currency-active-toggle';
import { getAdminCurrencies } from '@/features/finance/api/server/get-admin-finance';

export default async function AdminCurrenciesPage() {
  const currencies = await getAdminCurrencies();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Currencies</h1>
          <p className="text-sm text-muted-foreground">Manage display, payment, and settlement currencies.</p>
        </div>
        <Button asChild>
          <Link href="/admin/finance/currencies/new"><Plus className="mr-2 h-4 w-4" />New currency</Link>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Currency registry</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-3">Code</th>
                <th>Name</th>
                <th>Symbol</th>
                <th>Decimals</th>
                <th>Display</th>
                <th>Payment</th>
                <th>Settlement</th>
                <th>Active</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((currency) => (
                <tr key={currency.code} className="border-b last:border-0">
                  <td className="py-3 font-semibold">{currency.code}</td>
                  <td>{currency.name}</td>
                  <td>{currency.symbol}</td>
                  <td>{currency.decimalDigits}</td>
                  <td>{currency.isDisplayEnabled ? <Badge>Yes</Badge> : <Badge variant="outline">No</Badge>}</td>
                  <td>{currency.isPaymentEnabled ? <Badge>Yes</Badge> : <Badge variant="outline">No</Badge>}</td>
                  <td>{currency.isSettlementEnabled ? <Badge>Yes</Badge> : <Badge variant="outline">No</Badge>}</td>
                  <td><CurrencyActiveToggle code={currency.code} isActive={currency.isActive} /></td>
                  <td className="text-right"><Button asChild size="sm" variant="outline"><Link href={`/admin/finance/currencies/${currency.code}/edit`}>Edit</Link></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
