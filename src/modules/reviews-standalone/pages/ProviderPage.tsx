import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Textarea } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime } from "@core/lib/format";
import { replyToReviewAction } from "../actions";
import { getModuleSummary, listReviews } from "../repository";

function statusVariant(status: string) {
  if (["approved"].includes(status)) return "success" as const;
  if (["rejected", "hidden"].includes(status)) return "danger" as const;
  return "warning" as const;
}

export async function ProviderPage({ params }: { params: Record<string, string> }) {
  const providerId = params.providerId;
  const [summary, reviews] = await Promise.all([getModuleSummary(providerId), listReviews({ providerId, limit: 50 })]);
  const firstReview = reviews[0];
  return (
    <div className="space-y-6">
      <PageHeader title="Reviews & Reputation" description="See provider/staff/service reviews, reply publicly, and track moderation state before replies reach public front." />
      <div className="grid gap-4 md:grid-cols-4"><Card><CardContent><div className="text-sm font-bold text-slate-950">Reviews</div><p className="mt-1 text-2xl font-bold">{summary.reviewsCount}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Average rating</div><p className="mt-1 text-2xl font-bold">{summary.averageRating}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Replied</div><p className="mt-1 text-2xl font-bold">{summary.repliedCount}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Pending moderation</div><p className="mt-1 text-2xl font-bold">{summary.pendingCount}</p></CardContent></Card></div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card><CardHeader><CardTitle>Review inbox</CardTitle></CardHeader><CardContent>{reviews.length ? <div className="space-y-3">{reviews.map((review) => <div key={review.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold"><span data-user-content>{review.customerName}</span> · {review.rating || "—"}/5</div><div className="text-xs text-muted-foreground">{review.targetType} · {review.locale} · {formatDateTime(review.createdAt)}</div></div><Badge variant={statusVariant(review.status)}>{review.status}</Badge></div><p className="mt-2 text-muted-foreground" data-user-content>{review.body}</p><div className="mt-2 text-xs text-muted-foreground">Replies: {review.repliesCount} / approved {review.approvedRepliesCount}</div></div>)}</div> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No reviews yet.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Reply to review</CardTitle></CardHeader><CardContent><form action={replyToReviewAction} className="space-y-3"><input type="hidden" name="providerId" value={providerId} /><Field label="Review ID"><Input name="reviewId" defaultValue={firstReview?.id ?? ""} required /></Field><Field label="Reply"><Textarea name="body" placeholder="Public reply after moderation" required /></Field><Button type="submit" className="w-full">Submit reply for moderation</Button></form></CardContent></Card>
      </div>
    </div>
  );
}
