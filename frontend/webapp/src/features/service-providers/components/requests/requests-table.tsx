"use client";

import { useOptimistic, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { DataTable, DataTableSkeleton } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useAction from "@/hooks/use-action";
import { formatDate } from "@/lib/formatters";
import { Pagination } from "@/types/filter";

import {
  approveServiceProviderRequest,
  rejectServiceProviderRequest,
} from "../../actions/requests";
import {
  IServiceProviderRequestAdmin,
  IServiceProviderRequestStatus,
} from "../../types";
import { REQUESTS_TRANSLATION_KEY } from "../../types/constants";

type Props = {
  items: IServiceProviderRequestAdmin[];
  pagination: Pagination;
};

const RequestsTable = ({ items, pagination }: Props) => {
  const t = useTranslations(REQUESTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    items,
    (
      state: IServiceProviderRequestAdmin[],
      payload: { id: string; status: "Approved" | "Rejected" }
    ) =>
      state.map((it) =>
        it.id === payload.id ? { ...it, status: payload.status } : it
      )
  );

  const { execute: doApprove } = useAction(approveServiceProviderRequest, {
    startTransition,
  });
  const { execute: doReject } = useAction(rejectServiceProviderRequest, {
    startTransition,
  });

  const canAct = (status: IServiceProviderRequestStatus) =>
    status === "Pending";

  const getStatusVariant = (status: IServiceProviderRequestStatus) => {
    switch (status) {
      case "Pending":
        return "outline";
      case "Approved":
        return "default";
      case "Rejected":
        return "destructive";
    }
  };

  const locale = useLocale();

  const columns: ColumnDef<IServiceProviderRequestAdmin>[] = [
    {
      header: t("provider"),
      accessorKey: "serviceProviderName",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.serviceProviderName}</div>
      ),
    },
    {
      header: t("customer"),
      accessorKey: "customerFullName",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.customerFullName}</div>
      ),
    },
    {
      header: t("email"),
      accessorKey: "customerEmail",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.customerEmail}</div>
      ),
    },
    {
      header: t("message"),
      accessorKey: "message",
      cell: ({ row }) => <div className="text-sm">{row.original.message}</div>,
    },
    {
      header: t("status.title"),
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {t(`status.${row.original.status}`)}
        </Badge>
      ),
    },
    {
      header: t("date"),
      accessorKey: "createDate",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDate(row.original.createDate, locale)}
        </div>
      ),
    },
    {
      header: t("actions"),
      id: "actions",
      cell: ({ row }) => {
        const request = row.original as IServiceProviderRequestAdmin;
        const disabled = !canAct(request.status) || isPending;

        if (request.status !== "Pending") return null;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={disabled}
              onClick={() => {
                startTransition(async () => {
                  setOptimisticItems({
                    id: request.id,
                    status: "Approved",
                  });
                  await doApprove({ requestId: request.id });
                });
              }}
            >
              <Check className="size-4 text-green-500" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={disabled}
              onClick={() => {
                startTransition(async () => {
                  setOptimisticItems({
                    id: request.id,
                    status: "Rejected",
                  });
                  await doReject({ requestId: request.id });
                });
              }}
            >
              <X className="text-destructive size-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={optimisticItems}
      pagination={pagination}
    />
  );
};

export default RequestsTable;

export function RequestsDataTableSkeleton() {
  return <DataTableSkeleton columnCount={6} rowCount={10} />;
}
