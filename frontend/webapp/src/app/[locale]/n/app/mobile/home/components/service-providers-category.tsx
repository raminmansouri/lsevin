import type { HomeCategory } from '@/features/home/api/server/get-home-page';
import { getTourSettings } from '@/features/tours/server/platform/settings';

import { HomeServiceProvidersCategories, type HomeCategoryLabels } from './service-providers-category-section';

export async function ServiceProvidersCategoriesSuspenseBoundary({
  categories,
  locale,
  labels,
}: {
  categories: HomeCategory[];
  locale?: string;
  labels?: HomeCategoryLabels;
}) {
  // Same source the category browser uses; Tourism opens the Tours app directly.
  const tourismCategoryId = await getTourSettings()
    .then((settings) => settings.tourismCategoryId)
    .catch(() => null);

  return (
    <HomeServiceProvidersCategories
      categories={categories}
      locale={locale}
      labels={labels}
      tourismCategoryId={tourismCategoryId}
    />
  );
}