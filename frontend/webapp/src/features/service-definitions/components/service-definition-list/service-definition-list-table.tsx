"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { DataTable, DataTableSkeleton } from "@/components/data-table";
import { useRouter } from "@/i18n/navigation";
import { Pagination } from "@/types/filter";

import { SERVICE_DEFINITION_TRANSLATION_KEY } from "../../constants";
import { useServiceDefinitionActions } from "../../hooks/use-service-definition-list-actions";
import { ServiceDefinition } from "../../types/service-definition";
import { ServiceDefinitionDetailsModal } from "../service-definition-details-modal";
import { getServiceDefinitionListColumns } from "./service-definition-list-columns";
import { ServiceDefinitionListToolbar } from "./service-definition-list-toolbar";

type Props = {
  items: ServiceDefinition[];
  pagination: Pagination;
};

const ServiceDefinitionListTable = ({ items, pagination }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [selectedServiceDefinition, setSelectedServiceDefinition] =
    useState<ServiceDefinition | null>(null);
  const t = useTranslations(SERVICE_DEFINITION_TRANSLATION_KEY);
  const router = useRouter();

  const [optimisticItems, updateOptimisticItems] = useOptimistic(
    items,
    (
      state: ServiceDefinition[],
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

  const { handleDelete, handleToggleActivation, DeleteConfirmDialog } = useServiceDefinitionActions({
    startTransition,
  });

  const handleEditRow = (serviceDefinition: ServiceDefinition) => {
    router.push(`/admin/service-definitions/${serviceDefinition.id}/update`);
  };

  const handleDeleteRow = (serviceDefinition: ServiceDefinition) => {
    handleDelete({
      serviceDefinition,
      optimisticOperation: (ids) => {
        updateOptimisticItems({ type: "delete", id: ids[0]! });
      },
    });
  };

  const handleViewDetailsRow = (serviceDefinition: ServiceDefinition) => {
    setSelectedServiceDefinition(serviceDefinition);
  };

  const handleToggleActivationRow = (serviceDefinition: ServiceDefinition) => {
    handleToggleActivation({
      serviceDefinition,
      optimisticActivationOperation: (id) => {
        updateOptimisticItems({ type: "activation", id });
      },
    });
  };

  const columns = getServiceDefinitionListColumns(
    t,
    handleEditRow,
    handleDeleteRow,
    handleViewDetailsRow,
    handleToggleActivationRow,
    isPending
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={optimisticItems}
        pagination={pagination}
      >
        <ServiceDefinitionListToolbar />
      </DataTable>
      <DeleteConfirmDialog />
      {selectedServiceDefinition && (
        <ServiceDefinitionDetailsModal
          serviceDefinition={selectedServiceDefinition}
          onClose={() => setSelectedServiceDefinition(null)}
        />
      )}
    </>
  );
};

export default ServiceDefinitionListTable;

export function ServiceDefinitionListTableSkeleton() {
  return <DataTableSkeleton columnCount={6} rowCount={5} />;
}
