import type { HomeCategory } from '@/features/home/api/server/get-home-page';
import { HomeServiceProvidersCategories, type HomeCategoryLabels } from './service-providers-category-section';

export function ServiceProvidersCategoriesSuspenseBoundary({
  categories,
  locale,
  labels,
}: {
  categories: HomeCategory[];
  locale?: string;
  labels?: HomeCategoryLabels;
}) {
  return <HomeServiceProvidersCategories categories={categories} locale={locale} labels={labels} />;
}
