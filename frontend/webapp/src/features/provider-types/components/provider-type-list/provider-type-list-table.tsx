"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { DataTable, DataTableSkeleton } from "@/components/data-table";
import { useRouter } from "@/i18n/navigation";
import { Pagination } from "@/types/filter";

import { PROVIDER_TYPE_TRANSLATION_KEY } from "../../constants";
import { useProviderTypeActions } from "../../hooks/use-provider-type-list-actions";
import { ProviderTypeFiltered } from "../../types/provider-type";
import { ProviderTypeDetailsModal } from "../provider-type-details-modal";
import { getProviderTypeListColumns } from "./provider-type-list-columns";
import { ProviderTypeListToolbar } from "./provider-type-list-toolbar";

type Props = {
  items: ProviderTypeFiltered[];
  pagination: Pagination;
};

const ProviderTypeListTable = ({ items, pagination }: Props) => {
  const [, startTransition] = useTransition();
  const [selectedProviderTypeId, setSelectedProviderTypeId] = useState<
    string | null
  >(null);
  const t = useTranslations(PROVIDER_TYPE_TRANSLATION_KEY);
  const router = useRouter();

  const [optimisticItems, updateOptimisticItems] = useOptimistic(
    items,
    (
      state: ProviderTypeFiltered[],
      action: { type: "delete" | "activation"; id: string }
    ) => {
      if (action.type === "delete") {
        return state.filter((item) => item.id !== action.id);
      }
      if (action.type === "activation") {
        return state.map((item) =>
          item.id === action.id ? { ...item, isActive: !item.isActive } : item
        );
      }
      return state;
    }
  );

  const { handleDelete, DeleteConfirmDialog } = useProviderTypeActions({
    startTransition,
  });

  // const { execute: executeToggleActivation } = useAction(
  //   changeProviderTypeActivationAction,
  //   {
  //     startTransition,
  //     onSuccess: () => {
  //       toast.success(t("messages.success"));
  //     },
  //     onError: () => {
  //       toast.error(t("messages.error"));
  //     },
  //   }
  // );

  const handleEditRow = (providerType: ProviderTypeFiltered) => {
    router.push(`/admin/provider-types/${providerType.id}/update`);
  };

  const handleDeleteRow = (providerType: ProviderTypeFiltered) => {
    handleDelete({
      providerType,
      optimisticOperation: (ids) =>
        updateOptimisticItems({ type: "delete", id: ids[0]! }),
    });
  };

  const handleViewDetailsRow = (providerType: ProviderTypeFiltered) => {
    setSelectedProviderTypeId(providerType.id);
  };

  // const handleToggleActivationRow = async (providerType: ProviderType) => {
  //   startTransition(async () => {
  //     updateOptimisticItems({ type: "activation", id: providerType.id });
  //     await executeToggleActivation({
  //       providerTypeId: providerType.id,
  //       isActive: !providerType.isActive,
  //     });
  //   });
  // };

  const columns = getProviderTypeListColumns(
    t,
    handleEditRow,
    handleDeleteRow,
    handleViewDetailsRow
    // handleToggleActivationRow
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={optimisticItems}
        pagination={pagination}
      >
        <ProviderTypeListToolbar />
      </DataTable>
      <DeleteConfirmDialog />
      {selectedProviderTypeId && (
        <ProviderTypeDetailsModal
          providerTypeId={selectedProviderTypeId}
          onClose={() => setSelectedProviderTypeId(null)}
        />
      )}
    </>
  );
};

export default ProviderTypeListTable;

export function ProviderTypeListTableSkeleton() {
  return <DataTableSkeleton columnCount={5} rowCount={5} />;
}
