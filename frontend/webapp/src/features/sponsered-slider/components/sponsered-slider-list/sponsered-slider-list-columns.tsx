"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ExternalLink, MoreHorizontal, Play, Image as ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { env } from "@/config/env/client";

import type { SponseredSliderItem } from "../../types";

function mediaUrl(value?: string | null) {
  if (!value) return undefined;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) return value;
  return `${env.NEXT_PUBLIC_FILES_URL}/${value}`;
}

export const getSponseredSliderListColumns = (
  handleEdit: (item: SponseredSliderItem) => void,
  handleDelete: (item: SponseredSliderItem) => void,
  handleToggle: (item: SponseredSliderItem) => void,
  handleMove: (item: SponseredSliderItem, direction: "up" | "down") => void
): ColumnDef<SponseredSliderItem>[] => [
  {
    accessorKey: "title",
    header: "Sponsored media",
    cell: ({ row }) => {
      const item = row.original;
      const src = mediaUrl(item.url);
      const isVideo = item.mediaKind === "video" || item.url?.match(/\.(mp4|webm|mov|m4v)(\?|$)/i);
      return (
        <div className="flex min-w-[320px] items-center gap-3">
          <div className="relative h-16 w-24 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-200">
            {src ? (
              isVideo ? (
                <div className="relative flex h-full w-full items-center justify-center bg-gray-900 text-white">
                  <Play className="h-6 w-6" />
                  <video src={src} className="absolute inset-0 h-full w-full object-cover opacity-60" muted />
                </div>
              ) : (
                <ImageWithFallback fill src={src} alt={item.title || "Sponsored media"} className="object-cover" />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ImageIcon className="h-6 w-6" /></div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-gray-900">{item.title || "Untitled sponsored media"}</div>
            <div className="line-clamp-1 text-sm text-muted-foreground">{item.subtitle || item.url || "No subtitle"}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="rounded-full bg-[#083f30]/10 px-2 py-0.5 text-xs font-medium text-[#083f30]">
                {item.isActive ? "Active" : "Inactive"}
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{item.mediaTypeName || item.mediaKind || "media"}</span>
            </div>
          </div>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "displayOrder",
    header: "Order",
    cell: ({ row }) => <span className="font-medium">{row.original.displayOrder}</span>,
  },
  {
    accessorKey: "buttonLabel",
    header: "CTA",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="max-w-[220px] space-y-1 text-sm">
          <div className="font-medium">{item.buttonLabel || "Learn More"}</div>
          {item.link ? (
            <div className="flex items-center gap-1 truncate text-muted-foreground"><ExternalLink className="h-3.5 w-3.5" /> {item.link}</div>
          ) : <span className="text-muted-foreground">No link</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "url",
    header: "Media URL",
    cell: ({ row }) => <div className="max-w-[260px] truncate text-sm text-muted-foreground">{row.original.url || "-"}</div>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(item)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggle(item)}>{item.isActive ? "Deactivate" : "Activate"}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMove(item, "up")}><ArrowUp className="mr-2 h-4 w-4" /> Move up</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMove(item, "down")}><ArrowDown className="mr-2 h-4 w-4" /> Move down</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(item)} className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
