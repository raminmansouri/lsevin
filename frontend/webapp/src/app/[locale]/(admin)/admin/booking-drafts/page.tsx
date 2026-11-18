import { FileText } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { draftStatusKey } from "@/features/booking-drafts-admin/components/draft-labels";
import { formatMoney } from "@/features/booking-drafts-admin/lib/format";
import { getBookingDrafts } from "@/features/booking-drafts-admin/server/repository";
import { Link } from "@/i18n/navigation";

export default async function BookingDraftsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [items, t] = await Promise.all([
    getBookingDrafts(locale),
    getTranslations({ locale, namespace: "BookingDraftsAdmin" }),
  ]);

  return (
    <Card>
      <CardHeader className="flex-between border-b"><CardTitle><PageHeader title={t("title")} description={t("description")} /></CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{t("empty")}</p> : null}
        {items.map((item) => {
          const statusKey = draftStatusKey(item.status);
          const total = Number(item.totalAmount) > 0 ? formatMoney(Number(item.totalAmount), item.currency, locale) : null;
          return (
            <div key={item.id} className="flex flex-col gap-3 rounded-md border p-4 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between" data-testid="booking-draft-card">
              <Link href={`/admin/booking-drafts/${item.id}/update`} className="min-w-0 flex-1">
                <div className="font-medium">{item.customerName || t("unknownCustomer")} · {item.providerName || t("noProvider")}</div>
                <div className="text-sm text-muted-foreground">
                  {item.serviceName || t("noService")} · {t("stepNumber", { step: Number(item.currentStep ?? 1) })} · {statusKey ? t(`status.${statusKey}`) : item.status}
                  {total ? <> · <span dir="ltr">{total}</span></> : null}
                </div>
              </Link>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href={`/admin/booking-drafts/${item.id}/pre-invoice`} data-testid="booking-draft-pre-invoice-link">
                  <FileText className="size-4" />
                  {t("preInvoice")}
                </Link>
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
