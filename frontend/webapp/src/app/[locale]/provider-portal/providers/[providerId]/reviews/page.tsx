import { ReviewsManager } from "@/features/provider-portal/components/reviews-manager";
import { getProviderWorkspace, listProviderReviews } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderReviewsPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();

  const [workspace, reviews] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listProviderReviews(userId, providerId),
  ]);

  return <ReviewsManager workspace={workspace} reviews={reviews} />;
}
