"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CountryCode, parsePhoneNumberWithError } from "libphonenumber-js";
import { MoreHorizontal } from "lucide-react";
import { Locale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/formatters";

import { ServiceProvider } from "../../types";

export const getServiceProvidersListColumns = (
  t: ReturnType<typeof useTranslations>,
  handleEdit: (serviceProvider: ServiceProvider) => void,
  handleDelete: (serviceProvider: ServiceProvider) => void,
  // handleToggleActivation: (serviceProvider: ServiceProvider) => void
  locale: Locale
): ColumnDef<ServiceProvider>[] => [
  {
    accessorKey: "name",
    header: t("table.headers.name"),
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  // {
  //   accessorKey: "description",
  //   header: t("table.headers.description"),
  //   cell: ({ row }) => {
  //     const description = row.original.description;
  //     return (
  //       <div className="max-w-[200px] truncate" title={description}>
  //         {description}
  //       </div>
  //     );
  //   },
  // },
  {
    accessorKey: "providerTypeName",
    header: t("table.headers.providerType"),
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.providerTypeName}</Badge>
    ),
  },
  {
    accessorKey: "contactEmail",
    header: t("table.headers.contactEmail"),
    cell: ({ row }) => (
      <div className="text-sm">{row.original.contactEmail}</div>
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: t("table.headers.contactPhone"),
    cell: ({ row }) => {
      const countryCode = row.original.phoneNumberCountryCode;
      const phoneNumber = row.original.phoneNumber;

      if (!countryCode || !phoneNumber) {
        return <div className="text-muted-foreground">-</div>;
      }

      try {
        const formattedPhoneNumber = parsePhoneNumberWithError(
          phoneNumber,
          countryCode as CountryCode
        );
        return (
          <div className="text-sm" dir="ltr">
            {formattedPhoneNumber.formatInternational()}
          </div>
        );
      } catch (error) {
        console.error("Error formatting phone number:", error);
        return (
          <div className="text-sm">
            +{countryCode} {phoneNumber}
          </div>
        );
      }
    },
  },
  // {
  //   accessorKey: "address",
  //   header: t("table.headers.address"),
  //   cell: ({ row }) => {
  //     const address = row.original.address;
  //     return (
  //       <div className="max-w-[150px] truncate text-sm" title={address}>
  //         {address}
  //       </div>
  //     );
  //   },
  // },
  {
    accessorKey: "serviceCount",
    header: t("table.headers.serviceCount"),
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.serviceCount}</Badge>
    ),
  },
  {
    accessorKey: "staffCount",
    header: t("table.headers.staffCount"),
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.staffCount}</Badge>
    ),
  },
  // {
  //   accessorKey: "isActive",
  //   header: t("table.headers.status"),
  //   cell: ({ row }) => {
  //     const serviceProvider = row.original;
  //     return (
  //       <Switch
  //         checked={serviceProvider.isActive}
  //         onCheckedChange={() => handleToggleActivation(serviceProvider)}
  //       />
  //     );
  //   },
  // },
  {
    accessorKey: "createDate",
    header: t("table.headers.createDate"),
    cell: ({ row }) => {
      const date = row.original.createDate;
      return <div className="text-sm">{formatDate(date, locale)}</div>;
    },
  },
  {
    id: "actions",
    header: t("table.headers.actions"),
    cell: ({ row }) => {
      const serviceProvider = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link
              href={`/admin/service-providers/${serviceProvider.id}/details`}
            >
              <DropdownMenuItem>{t("actions.viewDetails")}</DropdownMenuItem>
            </Link>
            <DropdownMenuItem onClick={() => handleEdit(serviceProvider)}>
              {t("table.actions.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(serviceProvider)}
              className="text-destructive"
            >
              {t("table.actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
