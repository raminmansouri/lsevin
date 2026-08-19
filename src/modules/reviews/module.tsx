import type { ExtendedModuleDefinition } from "@core/modules/types";
import { ReviewsPage } from "./pages/ReviewsPage";
import { StaffReviewsPage } from "./pages/StaffReviewsPage";
import { AdminReviewsPage } from "./pages/AdminReviewsPage";

const reviewsModule: ExtendedModuleDefinition = {
  id: "provider-reviews",
  name: "Provider Reviews",
  version: "2.0.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/reviews",
  migrations: ["migrations/001_provider_staff_review_workflow.sql", "migrations/001_review_reply_roles.sql"],
  routes: [
    { key: "provider.reviews", scope: "provider", path: "providers/:providerId/reviews", title: "Reviews", icon: "reviews", providerPermission: "view", component: ReviewsPage },
    { key: "staff.reviews", scope: "portal", path: "staff/:staffId/reviews", title: "My reviews", icon: "reviews", component: StaffReviewsPage },
    { key: "admin.reviews", scope: "admin", path: "admin/reviews", title: "Review moderation", icon: "reviews", adminPermission: "REVIEW_ADMIN", component: AdminReviewsPage },
  ],
  navigation: [{ scope: "provider", label: "Reviews", hrefTemplate: "/providers/:providerId/reviews", icon: "reviews", routeKey: "provider.reviews", providerPermission: "view", order: 100 }],
};
export default reviewsModule;
