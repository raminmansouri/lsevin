"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CalendarClock, MoreHorizontal, Star, Stethoscope, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { env } from "@/config/env/client";

import type { Staff } from "../../types";

function mediaUrl(value?: string | null) {
  if (!value) return undefined;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) return value;
  return `${env.NEXT_PUBLIC_FILES_URL}/${value}`;
}

export const getStaffListColumns = (
  handleEdit: (staff: Staff) => void,
  handleDelete: (staff: Staff) => void,
  handleToggle: (staff: Staff) => void
): ColumnDef<Staff>[] => [
  {
    accessorKey: "name",
    header: "Staff",
    cell: ({ row }) => {
      const staff = row.original;
      return (
        <div className="flex min-w-[260px] items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-200">
            {staff.profileImageUrl ? (
              <ImageWithFallback
                fill
                src={mediaUrl(staff.profileImageUrl) || ""}
                alt={staff.name}
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#083f30]">
                {staff.name?.slice(0, 1) || "S"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-gray-900">{staff.name || "Untitled staff"}</div>
            <div className="truncate text-sm text-muted-foreground">{staff.title || staff.specialty || "No title"}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="rounded-full bg-[#083f30]/10 px-2 py-0.5 text-xs font-medium text-[#083f30]">
                {staff.isActive ? "Active" : "Inactive"}
              </span>
              {staff.specialty && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{staff.specialty}</span>}
            </div>
          </div>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-sm">
        <Star className="h-4 w-4 fill-current text-amber-500" />
        <span className="font-medium">{Number(row.original.rating || 0).toFixed(1)}</span>
        <span className="text-muted-foreground">({row.original.reviewCount})</span>
      </div>
    ),
  },
  {
    accessorKey: "serviceCount",
    header: "Coverage",
    cell: ({ row }) => {
      const staff = row.original;
      return (
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4" /> {staff.serviceCount} services</div>
          <div className="flex items-center gap-2"><UsersRound className="h-4 w-4" /> {staff.providerCount} providers</div>
          <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> {staff.bookingCount} bookings</div>
        </div>
      );
    },
  },
  {
    accessorKey: "consultationFee",
    header: "Fee",
    cell: ({ row }) => <span className="font-medium">{Number(row.original.consultationFee || 0).toLocaleString()}</span>,
  },
  {
    accessorKey: "experienceYears",
    header: "Experience",
    cell: ({ row }) => row.original.experienceYears ? `${row.original.experienceYears} years` : row.original.experience || "-",
  },
  {
    id: "actions",
    header: "Actions",
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
            <DropdownMenuItem onClick={() => handleEdit(staff)}>Edit full profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggle(staff)}>{staff.isActive ? "Deactivate" : "Activate"}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(staff)} className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
