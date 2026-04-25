"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { DataTable, DataTableSkeleton } from "@/components/data-table";
import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";
import { useRouter } from "@/i18n/navigation";
import type { Pagination } from "@/types/filter";

import { changeStaffActivationAction } from "../../actions/change-activation";
import { deleteStaffAction } from "../../actions/delete-staff";
import type { Staff } from "../../types";
import { getStaffListColumns } from "./staff-list-columns";
import { StaffListToolbar } from "./staff-list-toolbar";

type Props = {
  items: Staff[];
  pagination: Pagination;
};

const StaffListTable = ({ items, pagination }: Props) => {
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

  const { execute: executeDelete } = useAction(deleteStaffAction, {
    startTransition,
    onSuccess: () => {
      toast.success("Staff delete action completed. If bookings existed, the staff member was deactivated to protect history.");
      router.refresh();
    },
    onError: (error) => toast.error(error?.detail || "Delete failed."),
  });

  const { execute: executeToggle } = useAction(changeStaffActivationAction, {
    startTransition,
    onSuccess: () => { toast.success("Staff status updated."); router.refresh(); },
    onError: (error) => toast.error(error?.detail || "Status update failed."),
  });

  const [DeleteConfirmDialog, confirmDelete] = useConfirm(
    "Delete staff",
    "If this staff member already has bookings, the record will be deactivated instead of hard-deleted to protect booking history.",
    "destructive"
  );

  const handleEdit = (staff: Staff) => router.push(`/admin/staff/${staff.id}/update`);

  const handleDelete = async (staff: Staff) => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;
    startTransition(() => updateOptimisticItems({ removeIds: [staff.id] }));
    await executeDelete({ staffId: staff.id });
  };

  const handleToggle = async (staff: Staff) => {
    startTransition(() => updateOptimisticItems({ toggleId: staff.id }));
    await executeToggle({ staffId: staff.id, isActive: !staff.isActive });
  };

  const columns = getStaffListColumns(handleEdit, handleDelete, handleToggle);

  return (
    <>
      <DataTable columns={columns} data={optimisticItems} pagination={pagination}>
        <StaffListToolbar />
      </DataTable>
      <DeleteConfirmDialog />
    </>
  );
};

export default StaffListTable;

export function StaffListTableSkeleton() {
  return <DataTableSkeleton columnCount={6} rowCount={8} />;
}
