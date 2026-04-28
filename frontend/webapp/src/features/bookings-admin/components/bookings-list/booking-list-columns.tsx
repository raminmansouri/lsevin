"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import type { BookingListItem } from "../../types";

export const getBookingColumns = (
  onEdit: (item: BookingListItem) => void,
  onView: (item: BookingListItem) => void,
  onFinancial: (item: BookingListItem) => void,
  onPaymentTerms: (item: BookingListItem) => void,
): ColumnDef<BookingListItem>[] => [
  { accessorKey: 'providerName', header: 'Provider' },
  { accessorKey: 'serviceName', header: 'Service' },
  { accessorKey: 'customerName', header: 'Customer' },
  { accessorKey: 'bookingStatus', header: 'Booking status' },
  { accessorKey: 'paymentStatus', header: 'Payment status' },
  { accessorKey: 'totalAmount', header: 'Total' },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const item = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(item)}>Details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(item)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFinancial(item)}>Financial</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPaymentTerms(item)}>Payment terms</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];
