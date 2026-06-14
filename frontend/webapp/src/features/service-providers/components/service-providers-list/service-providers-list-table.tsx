"use client";

import { useOptimistic, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";

import { DataTable, DataTableSkeleton } from "@/components/data-table";
import { useRouter } from "@/i18n/navigation";
import { Pagination } from "@/types/filter";

import { useServiceProvidersListActions } from "../../hooks/use-service-providers-list-actions";
import { ServiceProvider } from "../../types";
import { TRANSLATION_KEY } from "../../types/constants";
import { getServiceProvidersListColumns } from "./service-providers-list-columns";
import { ServiceProvidersListToolbar } from "./service-providers-list-toolbar";

type Props = {
  items: ServiceProvider[];
  pagination: Pagination;
};

const ServiceProvidersListTable = ({ items, pagination }: Props) => {
  const [, startTransition] = useTransition();
  const t = useTranslations(TRANSLATION_KEY);
  const locale = useLocale();
  const router = useRouter();

  const [optimisticItems, deleteOptimisticItems] = useOptimistic(
    items,
    (state, ids: string[]) =>
      state.filter((item: ServiceProvider) => !ids.includes(item.id))
  );

  const { handleDelete, DeleteConfirmDialog } = useServiceProvidersListActions({
    startTransition,
  });

  const handleEditRow = (serviceProvider: ServiceProvider) => {
    router.push(`/admin/service-providers/${serviceProvider.id}/update`);
  };

  const handleDeleteRow = (serviceProvider: ServiceProvider) => {
    handleDelete({
      serviceProvider,
      optimisticOperation: (ids) => deleteOptimisticItems(ids),
    });
  };

  // const handleToggleRow = (serviceProvider: ServiceProvider) => {
  //   handleToggleActivation({
  //     serviceProvider,
  //     isActive: !serviceProvider.isActive,
  //   });
  // };

  const columns = getServiceProvidersListColumns(
    t,
    handleEditRow,
    handleDeleteRow,
    // handleToggleRow,
    locale
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={optimisticItems}
        pagination={pagination}
      >
        <ServiceProvidersListToolbar />
      </DataTable>
      <DeleteConfirmDialog />
    </>
  );
};

export function ServiceProvidersListTableSkeleton() {
  return <DataTableSkeleton columnCount={8} rowCount={10} />;
}

export default ServiceProvidersListTable;
