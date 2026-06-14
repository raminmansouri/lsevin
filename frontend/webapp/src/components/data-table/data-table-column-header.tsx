import * as React from "react";
import { Column } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  EyeOffIcon,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTableState } from "@/hooks/use-table-state";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const { isPending } = useTableState();
  const t = useTranslations("Common.DataTable");

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="data-[state=open]:bg-accent -ml-3 h-8"
            disabled={isPending}
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <SortDesc className="ml-2 size-4" />
            ) : column.getIsSorted() === "asc" ? (
              <SortAsc className="ml-2 size-4" />
            ) : (
              <ArrowUpDown className="ml-2 size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => column.toggleSorting(false)}
            className="flex gap-2"
          >
            <ArrowUp className="text-muted-foreground/70 size-3.5" />
            {t("sortAscending")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => column.toggleSorting(true)}
            className="flex gap-2"
          >
            <ArrowDown className="text-muted-foreground/70 size-3.5" />
            {t("sortDescending")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => column.toggleVisibility(false)}
            className="flex gap-2"
          >
            <EyeOffIcon className="text-muted-foreground/70 size-3.5" />
            {t("hideColumn")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
