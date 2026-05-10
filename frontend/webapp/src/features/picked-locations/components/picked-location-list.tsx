"use client";

import { useOptimistic, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ImageIcon, MapPin, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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

import { deletePickedLocationAction } from "../actions/delete-picked-location";
import { PickedLocationListItem } from "../types";
import { PickedLocationListToolbar } from "./picked-location-list-toolbar";

type Props = {
  items: PickedLocationListItem[];
  pagination: Pagination;
};

function isRenderableImage(value?: string | null) {
  if (!value) return false;
  return /^(https?:\/\/|\/|data:image\/)/i.test(value);
}

function coordinateLabel(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) return "-";
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function columns(onDelete: (item: PickedLocationListItem) => void): ColumnDef<PickedLocationListItem>[] {
  return [
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => {
        const previewUrl = row.original.imagePreviewUrl || (isRenderableImage(row.original.image) ? row.original.image : null);

        return (
          <div className="flex h-14 w-20 items-center justify-center overflow-hidden rounded-xl border bg-muted/30">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={row.original.city} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "city",
      header: "Location",
      cell: ({ row }) => (
        <div className="min-w-[220px]">
          <div className="flex items-center gap-2 font-medium">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {row.original.city || row.original.locationId}
          </div>
          <div className="text-xs text-muted-foreground">
            {[row.original.country, row.original.cityCode].filter(Boolean).join(" · ") || row.original.locationId}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "country",
      header: "Country",
      cell: ({ row }) => row.original.country ? <Badge variant="secondary">{row.original.country}</Badge> : "-",
    },
    {
      accessorKey: "coordinates",
      header: "Coordinates",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm" dir="ltr">
          {coordinateLabel(row.original.latitude, row.original.longitude)}
        </span>
      ),
    },
    {
      accessorKey: "imageReference",
      header: "Image reference",
      cell: ({ row }) => <span className="line-clamp-1 max-w-[260px] text-xs text-muted-foreground">{row.original.image}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/admin/picked-locations/${row.original.id}/update`}>
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(row.original)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

export function PickedLocationAdminList({ items, pagination }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, removeOptimistic] = useOptimistic(items, (state, id: string) =>
    state.filter((item) => item.id !== id),
  );

  const action = useAction(deletePickedLocationAction, {
    startTransition,
    onSuccess: () => {
      toast.success("Picked location deleted.");
      router.refresh();
    },
    onError: (error) => toast.error(error.detail || error.title || "Could not delete picked location."),
  });

  const onDelete = (item: PickedLocationListItem) => {
    if (!window.confirm(`Delete picked location ${item.city || item.id}?`)) return;
    removeOptimistic(item.id);
    action.execute({ pickedLocationId: item.id });
  };

  return (
    <DataTable columns={columns(onDelete)} data={optimisticItems} pagination={pagination}>
      <PickedLocationListToolbar />
    </DataTable>
  );
}

export function PickedLocationAdminListSkeleton() {
  return <DataTableSkeleton columnCount={6} rowCount={10} />;
}
