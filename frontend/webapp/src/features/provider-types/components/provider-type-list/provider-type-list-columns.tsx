
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { LexicalRenderer } from "@/components/editor/lexical-renderer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconRenderer } from "@/components/ui/icon-renderer";

import { ProviderTypeFiltered } from "../../types/provider-type";

const ProviderTypeVisual = ({ providerType }: { providerType: ProviderTypeFiltered }) => {
  const image = providerType.imagePreviewUrl || providerType.imageUrl;

  if (image) {
    return (
      <img
        src={image}
        alt={providerType.name}
        className="h-12 w-12 rounded-xl border bg-muted object-cover shadow-sm"
      />
    );
  }

  if (providerType.iconUrl) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted">
        <IconRenderer iconName={providerType.iconUrl} size={22} />
      </div>
    );
  }

  return <div className="h-12 w-12 rounded-xl border bg-muted" />;
};

export const getProviderTypeListColumns = (
  t: ReturnType<typeof useTranslations>,
  handleEdit: (providerType: ProviderTypeFiltered) => void,
  handleDelete: (providerType: ProviderTypeFiltered) => void,
  handleViewDetails: (providerType: ProviderTypeFiltered) => void
): ColumnDef<ProviderTypeFiltered>[] => [
  {
    id: "visual",
    header: "Image",
    cell: ({ row }) => <ProviderTypeVisual providerType={row.original} />,
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: t("table.name"),
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "description",
    header: t("table.description"),
    cell: ({ row }) => (
      <LexicalRenderer className="max-w-[260px] truncate" content={row.original.description || "-"} />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "attributeDefinitions",
    header: t("table.attributes"),
    cell: ({ row }) => <div className="text-center">{row.original.attributeDefinitionsCount || 0}</div>,
    enableSorting: false,
  },
  {
    accessorKey: "isActive",
    header: t("table.status"),
    cell: ({ row }) => (
      <span className={row.original.isActive ? "text-emerald-600" : "text-muted-foreground"}>
        {row.original.isActive ? t("status.active") : t("status.inactive")}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: "actions",
    header: t("table.actions"),
    cell: ({ row }) => {
      const providerType = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(providerType)}>
              {t("actions.viewDetails")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(providerType)}>
              {t("actions.editProviderType")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(providerType)} className="text-destructive">
              {t("actions.deleteProviderType")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
