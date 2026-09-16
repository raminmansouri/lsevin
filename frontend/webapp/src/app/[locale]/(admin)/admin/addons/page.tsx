import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAddons } from "@/features/service-relations/server/repository";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminGenerated" });
  return { title: t("addonsPageTitle") };
}

export default async function AddonsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [addons, t] = await Promise.all([listAddons(), getTranslations({ locale, namespace: "AdminGenerated" })]);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title={t("addonsPageTitle")} />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("price")}</TableHead>
              <TableHead>{t("linkedServices")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {addons.map((addon) => (
              <TableRow key={addon.id}>
                <TableCell className="font-medium">{addon.name}</TableCell>
                <TableCell>
                  {addon.currencyCode} {addon.price.toLocaleString()}
                </TableCell>
                <TableCell>{addon.linkedCount}</TableCell>
                <TableCell>
                  <Badge variant={addon.isActive ? "default" : "outline"}>{addon.isActive ? t("active") : t("inactive")}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/addons/${addon.id}/services`}>{t("manageServices")}</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!addons.length && <div className="text-muted-foreground py-6 text-center text-sm">{t("noServicesFound")}</div>}
      </CardContent>
    </Card>
  );
}
