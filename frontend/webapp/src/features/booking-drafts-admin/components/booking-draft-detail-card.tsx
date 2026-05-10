import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BookingDraftDetailCard({ draft }: { draft: any }) {
  const tAdmin = useTranslations("AdminGenerated");
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>{tAdmin("draftSummary")}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Info label={tAdmin("customer")} value={draft.customerName} />
          <Info label={tAdmin("provider")} value={draft.providerName} />
          <Info label={tAdmin("service")} value={draft.serviceName} />
          <Info label={tAdmin("specialist")} value={draft.specialistName} />
          <Info label={tAdmin("status")} value={draft.status} />
          <Info label={tAdmin("currentStep")} value={String(draft.currentStep ?? draft.current_step ?? '-')} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{tAdmin("draftChildBookings")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">{draft.draftChildBookings?.length ? draft.draftChildBookings.map((item: any) => <pre key={item.id} className="rounded-md border p-3 text-xs overflow-auto">{JSON.stringify(item, null, 2)}</pre>) : <p className="text-sm text-muted-foreground">{tAdmin("noChildDraftBookings")}</p>}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{tAdmin("draftDocuments")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">{draft.draftDocuments?.length ? draft.draftDocuments.map((item: any) => <div key={item.id} className="rounded-md border p-3 text-sm"><div className="font-medium">{item.title}</div><div className="text-muted-foreground">{item.fileName}</div></div>) : <p className="text-sm text-muted-foreground">{tAdmin("noDraftDocuments")}</p>}</CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="font-medium">{value || '-'}</div></div>;
}
