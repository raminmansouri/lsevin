"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { DataTable, DataTableSkeleton } from "@/components/data-table";
import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";
import { useRouter } from "@/i18n/navigation";
import type { Pagination } from "@/types/filter";

import { changeSponseredSliderActivationAction } from "../../actions/change-activation";
import { deleteSponseredSliderAction } from "../../actions/delete-sponsered-slider";
import { moveSponseredSliderAction } from "../../actions/move-sponsered-slider";
import type { SponseredSliderItem } from "../../types";
import { getSponseredSliderListColumns } from "./sponsered-slider-list-columns";
import { SponseredSliderListToolbar } from "./sponsered-slider-list-toolbar";

type Props = {
  items: SponseredSliderItem[];
  pagination: Pagination;
};

const SponseredSliderListTable = ({ items, pagination }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, updateOptimisticItems] = useOptimistic(
    items,
    (state, payload: { removeIds?: string[]; toggleId?: string }) => {
      if (payload.removeIds) return state.filter((item) => !payload.removeIds!.includes(item.id));
      if (payload.toggleId) return state.map((item) => item.id === payload.toggleId ? { ...item, isActive: !item.isActive } : item);
      return state;
    }
  );

  const { execute: executeDelete } = useAction(deleteSponseredSliderAction, {
    startTransition,
    onSuccess: () => { toast.success("Sponsored slider item deleted."); router.refresh(); },
    onError: (error) => toast.error(error?.detail || "Delete failed."),
  });

  const { execute: executeToggle } = useAction(changeSponseredSliderActivationAction, {
    startTransition,
    onSuccess: () => { toast.success("Sponsored slider status updated."); router.refresh(); },
    onError: (error) => toast.error(error?.detail || "Status update failed."),
  });

  const { execute: executeMove } = useAction(moveSponseredSliderAction, {
    startTransition,
    onSuccess: () => { toast.success("Sponsored slider order updated."); router.refresh(); },
    onError: (error) => toast.error(error?.detail || "Reorder failed."),
  });

  const [DeleteConfirmDialog, confirmDelete] = useConfirm(
    "Delete sponsored media",
    "This removes the item from media.sponsered_slider. It does not delete the original file from the media library.",
    "destructive"
  );

  const handleEdit = (item: SponseredSliderItem) => router.push(`/admin/sponsored-slider/${item.id}/update`);

  const handleDelete = async (item: SponseredSliderItem) => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;
    startTransition(() => updateOptimisticItems({ removeIds: [item.id] }));
    await executeDelete({ sliderId: item.id });
  };

  const handleToggle = async (item: SponseredSliderItem) => {
    startTransition(() => updateOptimisticItems({ toggleId: item.id }));
    await executeToggle({ sliderId: item.id, isActive: !item.isActive });
  };

  const handleMove = async (item: SponseredSliderItem, direction: "up" | "down") => {
    await executeMove({ sliderId: item.id, direction });
  };

  const columns = getSponseredSliderListColumns(handleEdit, handleDelete, handleToggle, handleMove);

  return (
    <>
      <DataTable columns={columns} data={optimisticItems} pagination={pagination}>
        <SponseredSliderListToolbar />
      </DataTable>
      <DeleteConfirmDialog />
    </>
  );
};

export default SponseredSliderListTable;

export function SponseredSliderListTableSkeleton() {
  return <DataTableSkeleton columnCount={5} rowCount={8} />;
}
