"use client";

import { ColumnDef } from "@tanstack/react-table";
import { EyeIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { DataTable, DataTableSkeleton } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/types/filter";

import { useConsultingDetailModal } from "../hooks/use-consulting-detail-modal";
import { IConsulting } from "../types";
import { TRANSLATION_KEY } from "../types/constants";
import { ConsultingDetailsModal } from "./consulting-details-modal";

type Props = {
  items: IConsulting[];
  pagination: Pagination;
};

const ConsultingTable = ({ items, pagination }: Props) => {
  const t = useTranslations(TRANSLATION_KEY);
  const { consultingId, open: openConsulting } = useConsultingDetailModal();

  const selectedConsulting = items.find(
    (item) => item.consultingId === consultingId
  );

  const columns: ColumnDef<IConsulting>[] = [
    {
      header: t("table.customer"),
      accessorKey: "customerName",
    },
    {
      header: t("table.email"),
      accessorKey: "customerEmail",
    },
    {
      header: t("table.description"),
      accessorKey: "description",
    },
    {
      header: t("table.category"),
      accessorKey: "categoryName",
      cell: ({ row }) => {
        return <Badge variant="outline">{row.original.categoryName}</Badge>;
      },
    },
    {
      header: "",
      accessorKey: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="cursor-pointer"
            onClick={() => openConsulting(row.original.consultingId)}
          >
            <EyeIcon className="size-4" />
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={items} pagination={pagination} />
      <ConsultingDetailsModal consulting={selectedConsulting} />
    </>
  );
};

export default ConsultingTable;

export function ConsultingDataTableSkeleton() {
  return <DataTableSkeleton columnCount={4} rowCount={10} />;
}
