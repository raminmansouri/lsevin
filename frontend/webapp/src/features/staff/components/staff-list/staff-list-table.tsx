"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { DataTable, DataTableSkeleton } from "@/components/data-table";
import { useRouter } from "@/i18n/navigation";
import { Pagination } from "@/types/filter";

import { STAFF_TRANSLATION_KEY } from "../../constants";
import { useStaffActions } from "../../hooks/use-staff-list-actions";
import { Staff } from "../../types";
import { StaffDetailsModal } from "../staff-details-modal";
import { getStaffListColumns } from "./staff-list-columns";
import { StaffListToolbar } from "./staff-list-toolbar";

type Props = {
  items: Staff[];
  pagination: Pagination;
};

const StaffListTable = ({ items, pagination }: Props) => {
  const [, startTransition] = useTransition();
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const t = useTranslations(STAFF_TRANSLATION_KEY);
  const router = useRouter();

  const [optimisticItems, deleteOptimisticItems] = useOptimistic(
    items,
    (state, ids: string[]) =>
      state.filter((item: Staff) => !ids.includes(item.id))
  );

  const { handleDelete, DeleteConfirmDialog } = useStaffActions({
    startTransition,
  });

  const handleEditRow = (staff: Staff) => {
    router.push(`/admin/staff/${staff.id}/update`);
  };

  const handleDeleteRow = (staff: Staff) => {
    handleDelete({
      staff,
      optimisticOperation: (ids) => deleteOptimisticItems(ids),
    });
  };

  const handleDetailsRow = (staff: Staff) => {
    setSelectedStaff(staff);
  };

  const columns = getStaffListColumns(
    t,
    handleEditRow,
    handleDeleteRow,
    handleDetailsRow
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={optimisticItems}
        pagination={pagination}
      >
        <StaffListToolbar />
      </DataTable>
      <DeleteConfirmDialog />
      {selectedStaff && (
        <StaffDetailsModal
          staff={selectedStaff}
          onClose={() => setSelectedStaff(null)}
        />
      )}
    </>
  );
};

export default StaffListTable;

export function StaffListTableSkeleton() {
  return <DataTableSkeleton columnCount={4} rowCount={5} />;
}
