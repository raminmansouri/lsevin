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

import { CategoryListItem } from "../../types/category";

export const getCategoryListColumns = (
  t: ReturnType<typeof useTranslations>,
  handleEdit: (category: CategoryListItem) => void,
  handleDelete: (category: CategoryListItem) => void,
  handleAddChild: (category: CategoryListItem) => void
): ColumnDef<CategoryListItem>[] => [
  {
    accessorKey: "name",
    header: t("table.name"),
    cell: ({ row }) => {
      const category = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{category.name}</span>
          {category.parentName && (
            <span className="text-muted-foreground text-sm">
              {category.parentName}
            </span>
          )}
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
  {
    id: "actions",
    header: t("table.actions"),
    cell: ({ row }) => {
      const category = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(category)}>
              {t("actions.editCategory")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddChild(category)}>
              {t("actions.addChildCategory")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(category)}
              className="text-destructive"
            >
              {t("actions.deleteCategory")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
