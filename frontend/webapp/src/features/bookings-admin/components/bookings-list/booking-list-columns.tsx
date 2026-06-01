"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import type { BookingListItem } from "../../types";

type BookingColumnTranslator = (key: string) => string;

export const getBookingColumns = (
  tAdmin: BookingColumnTranslator,
  onEdit: (item: BookingListItem) => void,
  onView: (item: BookingListItem) => void,
  onFinancial: (item: BookingListItem) => void,
  onPaymentTerms: (item: BookingListItem) => void,
): ColumnDef<BookingListItem>[] => [
  { accessorKey: 'providerName', header: tAdmin('provider') },
  { accessorKey: 'serviceName', header: tAdmin('service') },
  { accessorKey: 'customerName', header: tAdmin('customer') },
  { accessorKey: 'bookingStatus', header: tAdmin('bookingStatus') },
  { accessorKey: 'paymentStatus', header: tAdmin('paymentStatus') },
  { accessorKey: 'totalAmount', header: tAdmin('total') },
  {
    id: 'actions',
    header: tAdmin('actions'),
    cell: ({ row }) => {
      const item = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(item)}>{tAdmin('details')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(item)}>{tAdmin('edit')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFinancial(item)}>{tAdmin('financial')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPaymentTerms(item)}>{tAdmin('paymentTerms')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];
