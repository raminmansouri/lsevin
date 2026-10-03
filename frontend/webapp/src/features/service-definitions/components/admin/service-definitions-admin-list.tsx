"use client";

import { useRef, useTransition } from "react";

import { ColumnDef } from "@tanstack/react-table";
import {
    Clock,
    ImageIcon,
    MoreHorizontal,
    Pencil,
    PlayCircle,
    Settings2,
    Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { DataTable, DataTableSkeleton } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";
import { Link, useRouter } from "@/i18n/navigation";
import { Pagination } from "@/types/filter";

import { deleteServiceDefinitionAction } from "../../actions/delete-service-definition";
import type {
    AdminServiceDefinitionCategoryOption,
    AdminServiceDefinitionListItem,
} from "../../db/admin-service-definitions.queries";
import { ServiceDefinitionsListToolbar } from "./service-definitions-list-toolbar";

type Props = {
    items: AdminServiceDefinitionListItem[];
    pagination: Pagination;
    categories: AdminServiceDefinitionCategoryOption[];
};

function formatDate(value?: string | null) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeZone: "UTC",
    }).format(date);
}

function extractTextFromRichContent(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value)) {
        return value
            .map(extractTextFromRichContent)
            .filter(Boolean)
            .join(" ");
    }

    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;

        if (typeof record.text === "string") {
            return record.text;
        }

        if (Array.isArray(record.children)) {
            return record.children
                .map(extractTextFromRichContent)
                .filter(Boolean)
                .join(" ");
        }

        if (record.root) {
            return extractTextFromRichContent(record.root);
        }
    }

    return "";
}

function compactText(
    value: string | null | undefined,
    max = 140,
) {
    if (!value) {
        return "-";
    }

    let text = value;

    try {
        const parsed = JSON.parse(value);
        const extracted = extractTextFromRichContent(parsed);

        if (extracted) {
            text = extracted;
        }
    } catch {
        // Plain-text description.
    }

    text = text.replace(/\s+/g, " ").trim();

    if (!text) {
        return "-";
    }

    return text.length > max
        ? `${text.slice(0, max - 1)}…`
        : text;
}

const getColumns = (
    onDelete: (item: AdminServiceDefinitionListItem) => void,
    isPending: boolean,
    t: (key: string) => string,
): ColumnDef<AdminServiceDefinitionListItem>[] => [
    {
        accessorKey: "name",
        header: "Service definition",
        cell: ({ row }) => {
            const item = row.original;

            return (
                <div className="min-w-[260px] space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium leading-none">
              {item.name || "Untitled service"}
            </span>

                        {item.mediaUrl ? (
                            <Badge
                                variant="secondary"
                                className="gap-1 text-[10px] uppercase"
                            >
                                {item.mediaType === "video" ? (
                                    <PlayCircle className="size-3" />
                                ) : (
                                    <ImageIcon className="size-3" />
                                )}

                                {item.mediaType || "media"}
                            </Badge>
                        ) : null}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {compactText(item.description)}
                    </div>
                </div>
            );
        },
    },

    {
        accessorKey: "categoryName",
        header: "Category",
        cell: ({ row }) => (
            <Badge variant="secondary">
                {row.original.categoryName || "No category"}
            </Badge>
        ),
    },

    {
        accessorKey: "pricingModel",
        header: "Pricing",
        cell: ({ row }) => {
            const value = Number(row.original.value ?? 0);
            const normalizedValue = Number.isFinite(value) ? value : 0;

            return (
                <div className="text-sm">
                    <div>{row.original.pricingModel || "-"}</div>

                    <div
                        className="text-muted-foreground"
                        dir="ltr"
                    >
                        {normalizedValue} {row.original.currency || ""}
                    </div>
                </div>
            );
        },
    },

    {
        accessorKey: "durationMinutes",
        header: "Booking",
        cell: ({ row }) => {
            const duration = Number(row.original.durationMinutes ?? 0);

            const durationMinutes = Number.isFinite(duration)
                ? duration
                : 0;

            return (
                <div className="grid gap-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            <span>{durationMinutes} min</span>
          </span>

                    <span>
            {row.original.bookingUiMode || "-"}
          </span>

                    <span>
            {row.original.requiresSpecialist
                ? "Specialist required"
                : "No specialist required"}
          </span>
                </div>
            );
        },
    },

    {
        accessorKey: "providerServiceCount",
        header: "Usage",
        cell: ({ row }) => {
            const activeProviders = Number(
                row.original.activeProviderServiceCount ?? 0,
            );

            const providers = Number(
                row.original.providerServiceCount ?? 0,
            );

            const attributes = Number(
                row.original.attributeCount ?? 0,
            );

            const uploadRequirements = Number(
                row.original.uploadRequirementCount ?? 0,
            );

            return (
                <div className="grid gap-1 text-xs">
          <span>
            {Number.isFinite(activeProviders)
                ? activeProviders
                : 0}
              /
              {Number.isFinite(providers)
                  ? providers
                  : 0}{" "}
              active providers
          </span>

                    <span>
            {Number.isFinite(attributes)
                ? attributes
                : 0}{" "}
                        attributes
          </span>

                    <span>
            {Number.isFinite(uploadRequirements)
                ? uploadRequirements
                : 0}{" "}
                        upload requirements
          </span>
                </div>
            );
        },
    },

    {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
            <Badge
                variant={
                    row.original.isActive
                        ? "default"
                        : "secondary"
                }
            >
                {row.original.isActive
                    ? "Active"
                    : "Inactive"}
            </Badge>
        ),
    },

    {
        accessorKey: "createDate",
        header: "Created",
        cell: ({ row }) => (
            <span className="text-sm">
        {formatDate(row.original.createDate)}
      </span>
        ),
    },

    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={isPending}
                        aria-label="Open actions"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link
                            href={`/admin/service-definitions/${row.original.id}/update`}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("edit")}
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                        <Link
                            href={`/admin/service-definitions-new/${row.original.id}/addon-provider-types`}
                        >
                            <Settings2 className="mr-2 h-4 w-4" />
                            {t("addOnProviderTypes")}
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={isPending}
                        onClick={() => onDelete(row.original)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("remove")}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
];

export function ServiceDefinitionsAdminList({
                                                items,
                                                pagination,
                                                categories,
                                            }: Props) {
    const t = useTranslations("AdminGenerated");
    const router = useRouter();

    const [isPending, startTransition] =
        useTransition();

    const pendingDeleteIdRef =
        useRef<string | null>(null);

    const { execute: executeDelete } = useAction(
        deleteServiceDefinitionAction,
        {
            startTransition,

            onSuccess: () => {
                pendingDeleteIdRef.current = null;

                toast.success(
                    "Service definition removed.",
                );

                router.refresh();
            },

            onError: (error) => {
                pendingDeleteIdRef.current = null;

                toast.error(
                    error.detail ||
                    "Could not remove service definition.",
                );

                router.refresh();
            },
        },
    );

    const [
        DeleteConfirmDialog,
        confirmDelete,
    ] = useConfirm(
        "Remove service definition",
        "This will permanently remove the service definition. If it is used by provider or staff services, the system will block deletion and you should deactivate it instead.",
        "destructive",
    );

    const handleDelete = async (
        item: AdminServiceDefinitionListItem,
    ) => {
        if (isPending) {
            return;
        }

        const confirmed = await confirmDelete();

        if (!confirmed) {
            return;
        }

        pendingDeleteIdRef.current = item.id;

        startTransition(async () => {
            await executeDelete({
                serviceDefinitionId: item.id,
            });
        });
    };

    return (
        <>
            <DataTable
                columns={getColumns(
                    handleDelete,
                    isPending,
                    t,
                )}
                data={items}
                pagination={pagination}
            >
                <ServiceDefinitionsListToolbar
                    categories={categories}
                />
            </DataTable>

            <DeleteConfirmDialog />
        </>
    );
}

export function ServiceDefinitionsAdminListSkeleton() {
    return (
        <DataTableSkeleton
            columnCount={8}
            rowCount={10}
        />
    );
}