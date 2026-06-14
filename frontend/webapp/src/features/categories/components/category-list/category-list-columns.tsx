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
import { Switch } from "@/components/ui/switch";

import { CategoryListItem } from "../../types/category";
import Image from "next/image";
import { env } from "@/config/env/client";
import { getCategoryOverlayClassName, getCategoryOverlayStyle } from "../../utils/category-overlay";

export const getCategoryListColumns = (
  t: ReturnType<typeof useTranslations>,
  handleEdit: (category: CategoryListItem) => void,
  handleDelete: (category: CategoryListItem) => void,
  handleAddChild: (category: CategoryListItem) => void,
  handleToggleHomepage: (category: CategoryListItem, value: boolean) => void
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
    accessorKey: "gradient",
    header: "Overlay",
    cell: ({ row }) => {
      const gradient = row.original.gradient;
      const overlayClassName = getCategoryOverlayClassName(gradient);
      const overlayStyle = getCategoryOverlayStyle(gradient);

      return (
        <div className="flex items-center gap-2">
          <span
            className={[
              "inline-flex h-7 w-14 rounded-md",
              overlayClassName ? `bg-gradient-to-t ${overlayClassName}` : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={overlayStyle}
          />
          <span className="text-xs text-muted-foreground">
            {gradient ? "Custom" : "Default"}
          </span>
        </div>
      );
    },
    enableSorting: false,
  },
  
  {
    id: "displayInHomePage",
    header: "Show on homepage",
    cell: ({ row }) => {
      const category = row.original;
      const checked = category.displayInHomePage ?? true;
      return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={checked}
            onCheckedChange={(value) => handleToggleHomepage(category, value)}
            aria-label="Show on homepage"
          />
          <span className="text-xs text-muted-foreground">
            {checked ? "Shown" : "Hidden"}
          </span>
        </div>
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
  {
    accessorKey: "imageUrl",
    header: 'image',
    cell: ({ row }) => {
      const imageUrl = row.original.imageUrl;
      const description = row.original.description;
      return (
          <div style={{width:'100%',height:'100%'}}>
{imageUrl && <Image
                                src={`${env.NEXT_PUBLIC_FILES_URL}/${imageUrl}`}
                                 alt={description}
                                className="object-cover"
                                
                                width="50"
                                height="50"
                              />
                              }
          </div>
      );
    },
    enableSorting: false,
  }
];
