import { requireCurrentUser } from "@core/auth/session";
import { requireStaffProfilePermission } from "@core/auth/permissions";
import { getPortalLocale } from "@core/i18n/server";
import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Textarea } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime } from "@core/lib/format";
import { translatePortalText } from "@core/i18n/translate";
import { createStaffReviewReplyAction } from "../actions";
import { listStaffReviews } from "../repository";

export async function StaffReviewsPage({ params }: { params: Record<string, string> }) {
  const user = await requireCurrentUser();
  const staffId = params.staffId;
  const claim = await requireStaffProfilePermission(user.id, staffId, "replyToOwnReviews");
  if (!claim.serviceProviderId) throw new Error("The approved staff claim is not linked to a provider.");
  const locale = await getPortalLocale();
  const copy = (source: string) => translatePortalText(locale.locale, source);
  const reviews = await listStaffReviews(staffId, claim.serviceProviderId, locale.header);

  return <div className="space-y-6">
    <PageHeader title={copy("My reviews")} description={copy("Only reviews targeting your staff profile are shown. Replies are submitted to LSevin moderation before public display.")} />
    {reviews.length ? <div className="space-y-4">{reviews.map((review) => <Card key={review.id}><CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_420px]">
      <div><div className="flex flex-wrap items-center gap-2"><strong>{review.customerName}</strong><Badge>{review.rating ?? "—"}/5</Badge>{review.isVerified ? <Badge variant="success">{copy("Verified")}</Badge> : null}</div><div className="mt-2 text-xs text-muted-foreground">{formatDateTime(review.createdAt, locale.header)} · {review.providerServiceName || review.treatment || "—"}</div><p className="mt-3 text-sm leading-6">{review.commentText}</p></div>
      <form action={createStaffReviewReplyAction} className="rounded-xl bg-muted p-3"><input type="hidden" name="staffId" value={staffId} /><input type="hidden" name="reviewId" value={review.id} /><Field label={copy("Reply")}><Textarea name="replyText" required /></Field><Button type="submit" className="mt-3">{copy("Submit for moderation")}</Button></form>
    </CardContent></Card>)}</div> : <Card><CardContent><p className="text-sm text-muted-foreground">{copy("No reviews have been submitted for your profile yet.")}</p></CardContent></Card>}
  </div>;
}
