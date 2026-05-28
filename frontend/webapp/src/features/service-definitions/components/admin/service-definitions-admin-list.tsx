"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Clock, ImageIcon, MoreHorizontal, Pencil, PlayCircle, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DataTable, DataTableSkeleton } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";
import { Link, useRouter } from "@/i18n/navigation";
import { Pagination } from "@/types/filter";

import { deleteServiceDefinitionAction } from "../../actions/delete-service-definition";
import type {
  AdminServiceDefinitionCategoryOption,
  AdminServiceDefinitionListItem,
} from "../../db/admin-service-definitions.queries";
import { ServiceDefinitionsListToolbar } from "./service-definitions-list-toolbar";

type Props = {
  items: AdminServiceDefinitionListItem[];
  pagination: Pagination;
  categories: AdminServiceDefinitionCategoryOption[];
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

function compactText(value: string | null | undefined, max = 140) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "-";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const getColumns = (
  onDelete: (item: AdminServiceDefinitionListItem) => void,
  isPending: boolean,
): ColumnDef<AdminServiceDefinitionListItem>[] => [
  {
    accessorKey: "name",
    header: "Service definition",
    cell: ({ row }) => (
      <div className="min-w-[260px] space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium leading-none">{row.original.name || "Untitled service"}</span>
          {row.original.mediaUrl && (
            <Badge variant="secondary" className="gap-1 text-[10px] uppercase">
              {row.original.mediaType === "video" ? <PlayCircle className="size-3" /> : <ImageIcon className="size-3" />}
              {row.original.mediaType || "media"}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">{compactText(row.original.description)}</div>
      </div>
    ),
  },
  {
    accessorKey: "categoryName",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.categoryName || "No category"}</Badge>
    ),
  },
  {
    accessorKey: "pricingModel",
    header: "Pricing",
    cell: ({ row }) => (
      <div className="text-sm">
        <div>{row.original.pricingModel || "-"}</div>
        <div className="text-muted-foreground" dir="ltr">
          {row.original.value} {row.original.currency}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "durationMinutes",
    header: "Booking",
    cell: ({ row }) => (
      <div className="grid gap-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {row.original.durationMinutes} min</span>
        <span>{row.original.bookingUiMode}</span>
        <span>{row.original.requiresSpecialist ? "Specialist required" : "No specialist required"}</span>
      </div>
    ),
  },
  {
    accessorKey: "providerServiceCount",
    header: "Usage",
    cell: ({ row }) => (
      <div className="grid gap-1 text-xs">
        <span>{row.original.activeProviderServiceCount}/{row.original.providerServiceCount} active providers</span>
        <span>{row.original.attributeCount} attributes</span>
        <span>{row.original.uploadRequirementCount} upload requirements</span>
      </div>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    accessorKey: "createDate",
    header: "Created",
    cell: ({ row }) => <span className="text-sm">{formatDate(row.original.createDate)}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Link href={`/admin/service-definitions/${row.original.id}/update`}>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
          </Link>
          <Link href={`/admin/service-definitions-new/${row.original.id}/addon-provider-types`}>
            <DropdownMenuItem>
              <Settings2 className="mr-2 h-4 w-4" /> Add-on provider types
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            disabled={isPending}
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function ServiceDefinitionsAdminList({ items, pagination, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState(items);
  const pendingDeleteIdRef = useRef<string | null>(null);

  useEffect(() => {
    setRows(items);
  }, [items]);

  const { execute: executeDelete } = useAction(deleteServiceDefinitionAction, {
    startTransition,
    onSuccess: () => {
      const deletedId = pendingDeleteIdRef.current;
      if (deletedId) {
        setRows((currentRows) => currentRows.filter((item) => item.id !== deletedId));
      }
      pendingDeleteIdRef.current = null;
      toast.success("Service definition removed.");
      router.refresh();
    },
    onError: (error) => {
      pendingDeleteIdRef.current = null;
      toast.error(error.detail || "Could not remove service definition.");
      router.refresh();
    },
  });

  const [DeleteConfirmDialog, confirmDelete] = useConfirm(
    "Remove service definition",
    "This will permanently remove the service definition. If it is used by provider or staff services, the system will block deletion and you should deactivate it instead.",
    "destructive",
  );

  const handleDelete = async (item: AdminServiceDefinitionListItem) => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;

    pendingDeleteIdRef.current = item.id;
    startTransition(async () => {
      await executeDelete({ serviceDefinitionId: item.id });
    });
  };

  return (
    <>
      <DataTable columns={getColumns(handleDelete, isPending)} data={rows} pagination={pagination}>
        <ServiceDefinitionsListToolbar categories={categories} />
      </DataTable>
      <DeleteConfirmDialog />
    </>
  );
}

export function ServiceDefinitionsAdminListSkeleton() {
  return <DataTableSkeleton columnCount={8} rowCount={10} />;
}
