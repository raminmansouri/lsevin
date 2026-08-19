import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Badge } from "@core/ui/Badge";
import { Button, LinkButton } from "@core/ui/Button";
import { Card } from "@core/ui/Card";
import { formatMoney } from "@core/lib/format";
import { deleteProviderServiceAction } from "../actions";
import type { ProviderService } from "../types";
import { localizeReactTree } from "@core/i18n/localize-tree";

const t = (obj: Record<string, string>, key: string) => obj?.[key] || obj?.["en-US"] || obj?.["fa-IR"] || "Untitled";

export function ServicesTable({ providerId, services, locale = "en" }: { providerId: string; services: ProviderService[]; locale?: string }) {
  return localizeReactTree((
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3 text-right">Service</th><th className="px-4 py-3 text-right">Definition</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">Status</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.map((service) => (
              <tr key={service.id}>
                <td className="px-4 py-3 font-semibold text-slate-900">{t(service.displayNameTranslations, "fa-IR")}</td>
                <td className="px-4 py-3 text-muted-foreground">{service.serviceDefinitionName}</td>
                <td className="px-4 py-3">{formatMoney(service.value, service.currency)}</td>
                <td className="px-4 py-3"><Badge variant={service.isActive ? "success" : "warning"}>{service.isActive ? "Active" : "Inactive"}</Badge></td>
                <td className="px-4 py-3 text-left">
                  <div className="flex justify-end gap-2">
                    <LinkButton variant="secondary" href={`/providers/${providerId}/services/${service.id}/edit`}>Edit</LinkButton>
                    <form action={deleteProviderServiceAction}>
                      <input type="hidden" name="providerId" value={providerId} />
                      <input type="hidden" name="serviceId" value={service.id} />
                      <Button variant="ghost" className="text-red-600" type="submit"><Trash2 size={15} /></Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  ), locale);
}
