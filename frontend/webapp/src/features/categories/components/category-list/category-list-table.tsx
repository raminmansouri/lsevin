"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { DataTable, DataTableSkeleton } from "@/components/data-table";
import { useRouter } from "@/i18n/navigation";
import { Pagination } from "@/types/filter";

import { setCategoryHomepageDisplayAction } from "../../actions/set-homepage-display";
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

  // Local overrides so the toggle reflects instantly (optimistic) before refresh.
  const [homeFlags, setHomeFlags] = useState<Record<string, boolean>>({});

  const handleToggleHomepage = (category: CategoryListItem, value: boolean) => {
    const previous =
      homeFlags[category.categoryId] ?? category.displayInHomePage ?? true;
    setHomeFlags((state) => ({ ...state, [category.categoryId]: value }));

    startTransition(async () => {
      const result = await setCategoryHomepageDisplayAction(
        category.categoryId,
        value
      );
      if (result.ok) {
        toast.success(
          value
            ? `"${category.name}" will show on the homepage.`
            : `"${category.name}" is hidden from the homepage.`
        );
      } else {
        // Revert on failure.
        setHomeFlags((state) => ({
          ...state,
          [category.categoryId]: previous,
        }));
        toast.error(result.message ?? "Failed to update category.");
      }
    });
  };

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
    handleAddChildRow,
    handleToggleHomepage
  );

  const data = optimisticItems.map((item) => ({
    ...item,
    displayInHomePage:
      homeFlags[item.categoryId] ?? item.displayInHomePage ?? true,
  }));

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
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
