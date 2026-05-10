import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CustomerDetailCard({ customer }: { customer: any }) {
  const tAdmin = useTranslations("AdminGenerated");
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>{tAdmin("walletAccounts")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">{customer.wallets?.length ? customer.wallets.map((item: any) => <pre key={item.id} className="rounded-md border p-3 text-xs overflow-auto">{JSON.stringify(item, null, 2)}</pre>) : <p className="text-sm text-muted-foreground">{tAdmin("noWallets")}</p>}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{tAdmin("walletPaymentIntents")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">{customer.payment_intents?.length ? customer.payment_intents.map((item: any) => <pre key={item.id} className="rounded-md border p-3 text-xs overflow-auto">{JSON.stringify(item, null, 2)}</pre>) : <p className="text-sm text-muted-foreground">{tAdmin("noPaymentIntents")}</p>}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{tAdmin("walletTransactions")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">{customer.wallet_transactions?.length ? customer.wallet_transactions.map((item: any) => <pre key={item.id} className="rounded-md border p-3 text-xs overflow-auto">{JSON.stringify(item, null, 2)}</pre>) : <p className="text-sm text-muted-foreground">{tAdmin("noTransactions")}</p>}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{tAdmin("customerDocuments")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">{customer.documents?.length ? customer.documents.map((item: any) => <div key={item.id} className="rounded-md border p-3 text-sm"><div className="font-medium">Document #{item.id}</div><a className="underline text-primary" href={item.documentUrl} target="_blank">{tAdmin("openFile")}</a></div>) : <p className="text-sm text-muted-foreground">{tAdmin("noDocuments")}</p>}</CardContent>
      </Card>
    </div>
  );
}
