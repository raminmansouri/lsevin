"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { formatDepositAmount, getDepositSplit } from "../../lib/deposit-split";
import type { BookingListItem } from "../../types";
import { DualDate } from "@/accounting/lib/dual-date";

const timeOf = (value: unknown) => {
  if (!value) return 0;
  const time = new Date(value as string).getTime();
  return Number.isNaN(time) ? 0 : time;
};

type BookingColumnTranslator = (key: string) => string;

export const getBookingColumns = (
  tAdmin: BookingColumnTranslator,
  onEdit: (item: BookingListItem) => void,
  onView: (item: BookingListItem) => void,
  onFinancial: (item: BookingListItem) => void,
  onPaymentTerms: (item: BookingListItem) => void,
): ColumnDef<BookingListItem>[] => [
  { accessorKey: 'providerName', header: tAdmin('provider') },
  {
    accessorKey: 'serviceName',
    header: tAdmin('service'),
    cell: ({ row }) => {
      const item = row.original;
      return item.serviceName || '—';
    },
  },
  { accessorKey: 'customerName', header: tAdmin('customer') },
  {
    accessorKey: 'appointmentDate',
    header: tAdmin('bookingAppointmentDate'),
    sortingFn: (a, b) => timeOf(a.original.appointmentDate) - timeOf(b.original.appointmentDate),
    cell: ({ row }) => <DualDate value={row.original.appointmentDate} />,
  },
  {
    accessorKey: 'createDate',
    header: tAdmin('bookingCreatedAt'),
    sortingFn: (a, b) => timeOf(a.original.createDate) - timeOf(b.original.createDate),
    cell: ({ row }) => <DualDate value={row.original.createDate} />,
  },
  { accessorKey: 'bookingStatus', header: tAdmin('bookingStatus') },
  {
    accessorKey: 'paymentStatus',
    header: tAdmin('paymentStatus'),
    cell: ({ row }) => {
      const item = row.original;
      const split = getDepositSplit(item);
      if (!split) return item.paymentStatus ?? '-';
      return (
        <div>
          <div className="font-medium">{tAdmin('depositPaid')}</div>
          <div className="text-xs text-muted-foreground">
            {tAdmin('paidOnline')}: {formatDepositAmount(split.paid, item.payableCurrency)} · {tAdmin('dueAtPlace')}: {formatDepositAmount(split.dueAtPlace, item.payableCurrency)}
          </div>
        </div>
      );
    },
  },
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
