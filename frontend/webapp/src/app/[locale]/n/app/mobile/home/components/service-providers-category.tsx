import type { HomeCategory } from '@/features/home/api/server/get-home-page';
import { HomeServiceProvidersCategories } from './service-providers-category-section';

export function ServiceProvidersCategoriesSuspenseBoundary({
  categories,
}: {
  categories: HomeCategory[];
}) {
  return <HomeServiceProvidersCategories categories={categories} />;
}
