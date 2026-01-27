"use client";

import { useOptimistic, useTransition } from "react";
import { useTranslations } from "next-intl";

import { DataTable, DataTableSkeleton } from "@/components/data-table";
import { useRouter } from "@/i18n/navigation";
import { Pagination } from "@/types/filter";

import { CATEGORY_TRANSLATION_KEY } from "../../constants";
import { useCategoryActions } from "../../hooks/use-category-list-actions";
import { CategoryListItem } from "../../types/category";
import { getCategoryListColumns } from "./category-list-columns";
import { CategoryListToolbar } from "./category-list-toolbar";

type Props = {
  items: CategoryListItem[];
  pagination: Pagination;
};

const CategoryListTable = ({ items, pagination }: Props) => {
  const [, startTransition] = useTransition();
  const t = useTranslations(CATEGORY_TRANSLATION_KEY);
  const router = useRouter();

  const [optimisticItems, deleteOptimisticItems] = useOptimistic(
    items,
    (state, ids: string[]) =>
      state.filter((item: CategoryListItem) => !ids.includes(item.categoryId))
  );

  const { handleDelete, DeleteConfirmDialog } = useCategoryActions({
    startTransition,
  });

  const handleEditRow = (category: CategoryListItem) => {
    router.push(`/admin/categories/${category.categoryId}/update`);
  };

  const handleAddChildRow = (category: CategoryListItem) => {
    router.push(`/admin/categories/add?parentId=${category.categoryId}`);
  };

  const handleDeleteRow = (category: CategoryListItem) => {
    handleDelete({
      category,
      optimisticOperation: (ids) => deleteOptimisticItems(ids),
    });
  };

  const columns = getCategoryListColumns(
    t,
    handleEditRow,
    handleDeleteRow,
    handleAddChildRow
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={optimisticItems}
        pagination={pagination}
      >
        <CategoryListToolbar />
      </DataTable>
      <DeleteConfirmDialog />
    </>
  );
};

export default CategoryListTable;

export function CategoryListTableSkeleton() {
  return <DataTableSkeleton columnCount={6} rowCount={5} />;
}
