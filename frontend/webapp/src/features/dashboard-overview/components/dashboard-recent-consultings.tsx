import { ArrowRight, Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IConsulting } from "@/features/consulting/types";
import { Link } from "@/i18n/navigation";
import { TranslationType } from "@/types/next";

interface DashboardRecentConsultingsProps {
  consultings: IConsulting[];
  t: TranslationType;
}

export function DashboardRecentConsultings({
  consultings,
  t,
}: DashboardRecentConsultingsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold">
          {t("recentConsultings.title")}
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/consulting">
            {t("recentConsultings.viewAll")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {consultings.length === 0 ? (
          <div className="text-muted-foreground p-6 text-center">
            {t("recentConsultings.empty")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("recentConsultings.table.customer")}</TableHead>
                <TableHead>{t("recentConsultings.table.category")}</TableHead>
                <TableHead>
                  {t("recentConsultings.table.description")}
                </TableHead>
                <TableHead className="w-[100px]">
                  {t("recentConsultings.table.date")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultings.map((consulting) => (
                <TableRow key={consulting.consultingId}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {consulting.customerName}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {consulting.customerEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{consulting.categoryName}</Badge>
                  </TableCell>
                  <TableCell>
                    <div
                      className="max-w-[200px] truncate"
                      title={consulting.description}
                    >
                      {consulting.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center text-xs">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date().toLocaleDateString()}{" "}
                      {/* Use actual date when available */}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardRecentConsultingsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <Skeleton className="h-6 w-[200px]" />
        <Skeleton className="h-8 w-[100px]" />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-4 w-[80px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-[80px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-[100px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-[60px]" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[180px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[60px]" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
