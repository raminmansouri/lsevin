"use client";

import { DataTable, DataTableSkeleton } from "@/components/data-table";
import { useRouter } from "@/i18n/navigation";

import type { BookingListItem } from "../../types";
import { getBookingColumns } from "./booking-list-columns";

export default function BookingsListTable({ items }: { items: BookingListItem[] }) {
  const router = useRouter();
  const columns = getBookingColumns(
    (item) => router.push(`/admin/bookings/${item.id}/update`),
    (item) => router.push(`/admin/bookings/${item.id}/update`),
    (item) => router.push(`/admin/bookings/${item.id}/financial`),
    (item) => router.push(`/admin/bookings/${item.id}/payment-terms`),
  );

  return <DataTable columns={columns} data={items} pagination={{ page: 1, size: items.length || 1, totalElements: items.length, totalPages: 1 }} />;
}

export function BookingsListTableSkeleton() {
  return <DataTableSkeleton columnCount={6} rowCount={6} />;
}
