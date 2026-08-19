import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card } from "@core/ui/Card";
import { Textarea } from "@core/ui/Field";
import { formatDateTime } from "@core/lib/format";
import { createReviewReplyAction } from "../actions";
import type { ProviderReview } from "../types";
import { localizeReactTree } from "@core/i18n/localize-tree";

export function ReviewsManager({ providerId, reviews, locale = "fa-IR", timeZone = "Asia/Tehran" }: { providerId: string; reviews: ProviderReview[]; locale?: string; timeZone?: string }) {
  return localizeReactTree((
    <Card className="overflow-hidden">
      <div className="divide-y divide-border">
        {reviews.length ? reviews.map((review) => (
          <div key={review.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-bold text-slate-950" data-user-content>{review.customerName}</div>
                <Badge variant={review.moderationStatus === "approved" ? "success" : "warning"}>{review.moderationStatus}</Badge>
                {review.isVerified ? <Badge variant="success">Verified</Badge> : null}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(review.createdAt, locale, timeZone)} · <span data-user-content>{review.providerServiceName || review.treatment || "Provider review"}</span> · rating {review.rating ?? "—"}</div>
              <p className="mt-3 text-sm leading-6 text-slate-700" data-user-content>{review.commentText}</p>
              <div className="mt-2 text-xs text-muted-foreground">Replies: {review.repliesCount}</div>
            </div>
            <form action={createReviewReplyAction} className="rounded-xl bg-muted p-3">
              <input type="hidden" name="providerId" value={providerId} />
              <input type="hidden" name="reviewId" value={review.id} />
              <Textarea name="replyText" placeholder="Write provider reply..." className="min-h-24" required />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">Submitted to LSevin moderation before publication.</span>
                <Button type="submit" variant="secondary">Submit reply</Button>
              </div>
            </form>
          </div>
        )) : <div className="p-5 text-sm text-muted-foreground">No reviews yet.</div>}
      </div>
    </Card>
  ), locale);
}
