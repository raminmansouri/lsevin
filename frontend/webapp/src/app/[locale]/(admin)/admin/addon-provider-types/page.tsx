import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listProviderTypesForAddonAdmin } from "@/features/service-relations/server/repository";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminGenerated" });
  return { title: t("addonProviderTypesPageTitle") };
}

export default async function AddonProviderTypesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [providerTypes, t] = await Promise.all([
    listProviderTypesForAddonAdmin(locale),
    getTranslations({ locale, namespace: "AdminGenerated" }),
  ]);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title={t("addonProviderTypesPageTitle")} description={t("addonProviderTypesPageDescription")} />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("linkedServiceDefinitions")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {providerTypes.map((providerType) => (
              <TableRow key={providerType.id}>
                <TableCell className="font-medium">{providerType.name}</TableCell>
                <TableCell>{providerType.linkedCount}</TableCell>
                <TableCell>
                  <Badge variant={providerType.isActive ? "default" : "outline"}>
                    {providerType.isActive ? t("active") : t("inactive")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/addon-provider-types/${providerType.id}/services`}>{t("manageServiceDefinitions")}</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!providerTypes.length && <div className="text-muted-foreground py-6 text-center text-sm">{t("noServiceDefinitionsFound")}</div>}
      </CardContent>
    </Card>
  );
}
