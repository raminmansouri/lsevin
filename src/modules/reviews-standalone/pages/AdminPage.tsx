import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime } from "@core/lib/format";
import { moderateReplyAction, moderateReviewAction } from "../actions";
import { getModuleSummary, listReplies, listReviews } from "../repository";

function statusVariant(status: string) {
  if (["approved"].includes(status)) return "success" as const;
  if (["rejected", "hidden"].includes(status)) return "danger" as const;
  return "warning" as const;
}

export async function AdminPage() {
  const [summary, reviews, replies] = await Promise.all([getModuleSummary(), listReviews({ limit: 100 }), listReplies(undefined, 100)]);
  return (
    <div className="space-y-6">
      <PageHeader title="Reviews Moderation" description="Moderate reviews and provider replies before they are visible on LSevin public provider/service/staff pages." />
      <div className="grid gap-4 md:grid-cols-4"><Card><CardContent><div className="text-sm font-bold text-slate-950">Reviews</div><p className="mt-1 text-2xl font-bold">{summary.reviewsCount}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Pending reviews</div><p className="mt-1 text-2xl font-bold">{summary.pendingCount}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Replies</div><p className="mt-1 text-2xl font-bold">{replies.length}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Average rating</div><p className="mt-1 text-2xl font-bold">{summary.averageRating}</p></CardContent></Card></div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Review queue</CardTitle></CardHeader><CardContent>{reviews.length ? <div className="space-y-3">{reviews.map((review) => <div key={review.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold">{review.customerName} · {review.rating || "—"}/5</div><div className="font-mono text-xs text-muted-foreground">{review.id}</div><div className="text-xs text-muted-foreground">Provider {review.serviceProviderId || "—"} · {formatDateTime(review.createdAt)}</div></div><Badge variant={statusVariant(review.status)}>{review.status}</Badge></div><p className="mt-2 text-muted-foreground">{review.body}</p><form action={moderateReviewAction} className="mt-3 grid gap-3 md:grid-cols-[1fr_2fr_auto]"><input type="hidden" name="reviewId" value={review.id} /><Field label="Decision"><Select name="decision" defaultValue="approved"><option value="approved">Approve</option><option value="rejected">Reject</option><option value="hidden">Hide</option></Select></Field><Field label="Reason"><Input name="reason" /></Field><div className="flex items-end"><Button type="submit">Apply</Button></div></form></div>)}</div> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No reviews found.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Reply queue</CardTitle></CardHeader><CardContent>{replies.length ? <div className="space-y-3">{replies.map((reply) => <div key={reply.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-xs">{reply.id}</div><div className="text-xs text-muted-foreground">Review {reply.reviewId} · {reply.authorEntityType}</div></div><Badge variant={statusVariant(reply.status)}>{reply.status}</Badge></div><p className="mt-2 text-muted-foreground">{reply.body}</p><form action={moderateReplyAction} className="mt-3 grid gap-3 md:grid-cols-[1fr_2fr_auto]"><input type="hidden" name="replyId" value={reply.id} /><Field label="Decision"><Select name="decision" defaultValue="approved"><option value="approved">Approve</option><option value="rejected">Reject</option><option value="hidden">Hide</option></Select></Field><Field label="Reason"><Input name="reason" /></Field><div className="flex items-end"><Button type="submit">Apply</Button></div></form></div>)}</div> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No replies found.</p>}</CardContent></Card>
      </div>
    </div>
  );
}
