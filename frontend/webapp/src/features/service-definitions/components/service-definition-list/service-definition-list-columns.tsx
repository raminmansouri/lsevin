"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ImageIcon, MoreHorizontal, PlayCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { SafeLexicalRenderer } from "../safe-lexical-renderer";
import { Badge } from "@/components/ui/badge";
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
  handleViewDetails: (serviceDefinition: ServiceDefinition) => void,
  handleToggleActivation: (serviceDefinition: ServiceDefinition) => void,
  isPending: boolean
): ColumnDef<ServiceDefinition>[] => [
  {
    accessorKey: "name",
    header: t("table.name"),
    cell: ({ row }) => {
      const serviceDefinition = row.original;
      return (
        <div className="flex min-w-[240px] flex-col gap-1">
          <span className="font-medium">{serviceDefinition.name}</span>
          <span className="text-muted-foreground text-sm">{serviceDefinition.categoryName}</span>
          <div className="flex flex-wrap gap-1">
            <Badge variant={serviceDefinition.isActive ? "default" : "secondary"}>
              {serviceDefinition.isActive ? t("status.active") : t("status.inactive")}
            </Badge>
            <Badge variant="outline">{serviceDefinition.pricingModel}</Badge>
            {serviceDefinition.mediaUrl && (
              <Badge variant="secondary" className="gap-1">
                {serviceDefinition.mediaType === "video" ? <PlayCircle className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                {serviceDefinition.mediaType?.toUpperCase() || "MEDIA"}
              </Badge>
            )}
          </div>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "description",
    header: t("table.description"),
    cell: ({ row }) => (
      <SafeLexicalRenderer className="line-clamp-2 max-w-[280px] text-sm text-muted-foreground" content={row.original.description || "-"} />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "durationMinutes",
    header: t("table.duration"),
    cell: ({ row }) => <span>{row.original.durationMinutes} min</span>,
    enableSorting: true,
  },
  {
    accessorKey: "basePrice",
    header: t("table.price"),
    cell: ({ row }) => <span>{row.original.basePrice} {row.original.currency}</span>,
    enableSorting: true,
  },
  {
    id: "definitionItems",
    header: "Definition items",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">{item.attributeCount} attrs</Badge>
          <Badge variant="secondary">{item.requirementCount} domain reqs</Badge>
          <Badge variant="secondary">{item.uploadRequirementCount} upload reqs</Badge>
        </div>
      );
    },
  },
  {
    id: "usage",
    header: "Usage",
    cell: ({ row }) => (
      <div className="flex flex-col text-xs text-muted-foreground">
        <span>{row.original.providerServiceCount} provider services</span>
        <span>{row.original.staffServiceCount} staff services</span>
      </div>
    ),
  },
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
            <DropdownMenuItem onClick={() => handleViewDetails(serviceDefinition)}>
              {t("actions.viewDetails")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(serviceDefinition)}>
              {t("actions.editServiceDefinition")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleActivation(serviceDefinition)} disabled={isPending}>
              <div className="flex items-center gap-2">
                {serviceDefinition.isActive ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-gray-500" />}
                {t("actions.toggleActivation")}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(serviceDefinition)} className="text-destructive">
              {t("actions.deleteServiceDefinition")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
