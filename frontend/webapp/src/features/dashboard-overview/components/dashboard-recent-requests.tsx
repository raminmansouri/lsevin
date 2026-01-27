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
import { IServiceProviderRequestAdmin } from "@/features/service-providers/types";
import { Link } from "@/i18n/navigation";
import { TranslationType } from "@/types/next";

interface DashboardRecentRequestsProps {
  requests: IServiceProviderRequestAdmin[];
  t: TranslationType;
}

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "outline";
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    default:
      return "secondary";
  }
};

export function DashboardRecentRequests({
  requests,
  t,
}: DashboardRecentRequestsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold">
          {t("recentRequests.title")}
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/service-providers-request">
            {t("recentRequests.viewAll")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {requests.length === 0 ? (
          <div className="text-muted-foreground p-6 text-center">
            {t("recentRequests.empty")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("recentRequests.table.customer")}</TableHead>
                <TableHead>
                  {t("recentRequests.table.serviceProvider")}
                </TableHead>
                {/* <TableHead>{t("recentRequests.table.message")}</TableHead> */}
                <TableHead>{t("recentRequests.table.status.title")}</TableHead>
                <TableHead className="w-[100px]">
                  {t("recentRequests.table.date")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {request.customerFullName}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {request.customerEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {request.serviceProviderName}
                      </span>
                    </div>
                  </TableCell>
                  {/* <TableCell>
                    <div
                      className="max-w-[200px] truncate"
                      title={request.message}
                    >
                      {request.message}
                    </div>
                  </TableCell> */}
                  <TableCell>
                    <Badge variant={getStatusVariant(request.status)}>
                      {t(`recentRequests.table.status.${request.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center text-xs">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(request.createDate).toLocaleDateString()}
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

export function DashboardRecentRequestsSkeleton() {
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
                <Skeleton className="h-4 w-[120px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-[80px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-[60px]" />
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
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[160px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[80px]" />
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
