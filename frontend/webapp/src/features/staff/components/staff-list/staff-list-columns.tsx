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

import { Staff } from "../../types";

export const getStaffListColumns = (
  t: ReturnType<typeof useTranslations>,
  handleEdit: (staff: Staff) => void,
  handleDelete: (staff: Staff) => void,
  handleDetails: (staff: Staff) => void
): ColumnDef<Staff>[] => [
  {
    accessorKey: "name",
    header: t("table.name"),
    cell: ({ row }) => {
      const staff = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{staff.name}</span>
          <span className="text-muted-foreground text-sm">{staff.title}</span>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "biography",
    header: t("table.biography"),
    cell: ({ row }) => {
      const biography = row.original.biography;
      return (
        <LexicalRenderer
          className="max-w-[200px] truncate"
          content={biography || "-"}
        />
      );
    },
    enableSorting: false,
  },
  // {
  //   accessorKey: "isActive",
  //   header: t("table.status"),
  //   cell: ({ row }) => {
  //     const isActive = row.original.isActive;
  //     return (
  //       <span
  //         className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
  //           isActive
  //             ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
  //             : "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10"
  //         }`}
  //       >
  //         {isActive ? t("status.active") : t("status.inactive")}
  //       </span>
  //     );
  //   },
  //   enableSorting: true,
  // },
  {
    id: "actions",
    header: t("table.actions"),
    cell: ({ row }) => {
      const staff = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleDetails(staff)}>
              {t("actions.viewDetails")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(staff)}>
              {t("actions.editStaff")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(staff)}
              className="text-destructive"
            >
              {t("actions.deleteStaff")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
