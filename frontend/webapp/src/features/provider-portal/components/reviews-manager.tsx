import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { tCommon, tStatus } from "../lib/i18n";

import type { ProviderWorkspace, ReviewRow } from "../types";

export function ReviewsManager({
  workspace,
  reviews,
}: {
  workspace: ProviderWorkspace;
  reviews: ReviewRow[];
}) {
  const t = useTranslations("ProviderPortal");

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          {tCommon(t, "reviews", "Reviews")}
        </CardTitle>
        <CardDescription>
          {tCommon(
            t,
            "reviewsDescription",
            "Read-only provider review stream. Reply/moderation can be added when a reply table exists.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviews.length ? (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{review.customerName}</h3>
                    {review.rating ? <Badge>{review.rating}/5</Badge> : null}
                    {review.isVerified ? (
                      <Badge variant="outline">
                        {tCommon(t, "verified", "Verified")}
                      </Badge>
                    ) : null}
                    <Badge variant={review.isPublic ? "default" : "secondary"}>
                      {review.isPublic
                        ? tStatus(t, "public")
                        : tStatus(t, "hidden")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {review.commentText}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    {review.country ? <span>{review.country}</span> : null}
                    {review.treatment ? (
                      <span>· {review.treatment}</span>
                    ) : null}
                    <span>· {new Date(review.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
            {tCommon(t, "noReviewsYet", "No reviews yet.")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
