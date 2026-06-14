"use client";


import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { Link, useRouter } from "@/i18n/navigation";
import { Pagination } from "@/types/filter";

import { deleteServiceProviderDirectAction } from "../../actions/admin";
import { AdminServiceProviderListItem } from "../../db/admin-service-providers.queries";
import { ServiceProvidersListToolbar } from "../service-providers-list/service-providers-list-toolbar";

type Props = {
  items: AdminServiceProviderListItem[];
  pagination: Pagination;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

function columns(onDelete: (item: AdminServiceProviderListItem) => void): ColumnDef<AdminServiceProviderListItem>[] {
  return [
    {
      accessorKey: "name",
      header: "Provider",
      cell: ({ row }) => (
        <div className="min-w-[220px]">
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.city}, {row.original.country}</div>
        </div>
      ),
    },
    {
      accessorKey: "providerTypeName",
      header: "Type",
      cell: ({ row }) => <Badge variant="secondary">{row.original.providerTypeName}</Badge>,
    },
    {
      accessorKey: "contactEmail",
      header: "Contact",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.contactEmail}</div>
          <div className="text-muted-foreground" dir="ltr">{row.original.phoneNumberCountryCode} {row.original.phoneNumber}</div>
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={row.original.isActive ? "default" : "secondary"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>
          {row.original.accredited ? <Badge variant="outline">Accredited</Badge> : null}
          {row.original.isSponsored ? <Badge>{row.original.sponsoredTag || "Sponsored"}</Badge> : null}
        </div>
      ),
    },
    {
      accessorKey: "serviceCount",
      header: "Content",
      cell: ({ row }) => (
        <div className="grid gap-1 text-xs">
          <span>{row.original.serviceCount} services</span>
          <span>{row.original.staffCount} staff</span>
          <span>{row.original.galleryItemCount} media</span>
        </div>
      ),
    },
    {
      accessorKey: "rating",
      header: "Quality",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.rating.toFixed(2)} ★</div>
          <div className="text-muted-foreground">{row.original.reviewCount} reviews</div>
        </div>
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
            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/admin/service-providers/${row.original.id}/details`}><DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> Details</DropdownMenuItem></Link>
            <Link href={`/admin/service-providers/${row.original.id}/update`}><DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem></Link>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(row.original)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

export function ServiceProvidersAdminList({ items, pagination }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, removeOptimistic] = useOptimistic(items, (state, id: string) => state.filter((item) => item.id !== id));
  const action = useAction(deleteServiceProviderDirectAction, {
    startTransition,
    onSuccess: () => {
      toast.success(tAdmin("serviceProviderDeleted"));
      router.refresh();
    },
    onError: (error) => toast.error(error.detail || error.title || "Could not delete service provider."),
  });

  const onDelete = (item: AdminServiceProviderListItem) => {
    if (!window.confirm(`Delete ${item.name}? This also deletes child rows with cascade constraints.`)) return;
    removeOptimistic(item.id);
    action.execute({ id: item.id });
  };

  return (
    <DataTable columns={columns(onDelete)} data={optimisticItems} pagination={pagination}>
      <ServiceProvidersListToolbar />
    </DataTable>
  );
}

export function ServiceProvidersAdminListSkeleton() {
  return <DataTableSkeleton columnCount={8} rowCount={10} />;
}
