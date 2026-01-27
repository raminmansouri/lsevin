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

import { ServiceDefinition } from "../../types/service-definition";

export const getServiceDefinitionListColumns = (
  t: ReturnType<typeof useTranslations>,
  handleEdit: (serviceDefinition: ServiceDefinition) => void,
  handleDelete: (serviceDefinition: ServiceDefinition) => void,
  handleViewDetails: (serviceDefinition: ServiceDefinition) => void
  // handleToggleActivation: (serviceDefinition: ServiceDefinition) => void,
  // isPending: boolean
): ColumnDef<ServiceDefinition>[] => [
  {
    accessorKey: "name",
    header: t("table.name"),
    cell: ({ row }) => {
      const serviceDefinition = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{serviceDefinition.name}</span>
          <span className="text-muted-foreground text-sm">
            {serviceDefinition.categoryName}
          </span>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "description",
    header: t("table.description"),
    cell: ({ row }) => {
      const description = row.original.description;
      return (
        <LexicalRenderer
          className="max-w-[200px] truncate"
          content={description || "-"}
        />
      );
    },
    enableSorting: false,
  },
  // {
  //   accessorKey: "durationMinutes",
  //   header: t("table.duration"),
  //   cell: ({ row }) => {
  //     const duration = row.original.durationMinutes;
  //     return <span>{duration} min</span>;
  //   },
  //   enableSorting: true,
  // },
  // {
  //   accessorKey: "basePrice",
  //   header: t("table.price"),
  //   cell: ({ row }) => {
  //     const serviceDefinition = row.original;
  //     return (
  //       <span>
  //         {serviceDefinition.basePrice} {serviceDefinition.currency}
  //       </span>
  //     );
  //   },
  //   enableSorting: true,
  // },
  // {
  //   accessorKey: "isActive",
  //   header: t("table.status"),
  //   cell: ({ row }) => (
  //     <Badge variant={row.original.isActive ? "default" : "secondary"}>
  //       {row.original.isActive ? t("status.active") : t("status.inactive")}
  //     </Badge>
  //   ),
  // },
  {
    id: "actions",
    header: t("table.actions"),
    cell: ({ row }) => {
      const serviceDefinition = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleViewDetails(serviceDefinition)}
            >
              {t("actions.viewDetails")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(serviceDefinition)}>
              {t("actions.editServiceDefinition")}
            </DropdownMenuItem>
            {/* <DropdownMenuItem
              onClick={() => handleToggleActivation(serviceDefinition)}
              disabled={isPending}
            >
              <div className="flex items-center gap-2">
                {serviceDefinition.isActive ? (
                  <ToggleRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-gray-500" />
                )}
                {t("actions.toggleActivation")}
              </div>
            </DropdownMenuItem> */}
            <DropdownMenuItem
              onClick={() => handleDelete(serviceDefinition)}
              className="text-destructive"
            >
              {t("actions.deleteServiceDefinition")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
