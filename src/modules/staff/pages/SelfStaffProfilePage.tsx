import { requireCurrentUser } from "@core/auth/session";
import { requireStaffProfilePermission } from "@core/auth/permissions";
import { Button, LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Input, Field } from "@core/ui/Field";
import { LocalizedField } from "@core/ui/LocalizedField";
import { MediaPicker } from "@core/ui/MediaPicker";
import { PageHeader } from "@core/ui/PageHeader";
import { updateClaimedStaffProfileAction } from "../actions";
import { getStaffProfile } from "../repository";

export async function SelfStaffProfilePage({ params }: { params: Record<string, string> }) {
  const user = await requireCurrentUser();
  const claim = await requireStaffProfilePermission(user.id, params.staffId, "manageOwnProfile");
  if (!claim.serviceProviderId) throw new Error("The approved staff claim is not linked to a provider.");
  const profile = await getStaffProfile(params.staffId);

  if (!profile) {
    return <PageHeader title="Staff profile not found" description="The requested staff profile does not exist or is no longer active." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Manage my LSevin staff profile" description="This page is only available after clinic confirmation, LSevin approval, and payment/waiver completion." />
      <div className="flex flex-wrap gap-2">
        <LinkButton href={`/staff/${params.staffId}/services/pricing`} variant="secondary">Service prices</LinkButton>
        <LinkButton href={`/staff/${params.staffId}/availability`} variant="secondary">Availability</LinkButton>
        <LinkButton href={`/staff/${params.staffId}/bookings`} variant="secondary">Bookings</LinkButton>
        <LinkButton href={`/staff/${params.staffId}/reviews`} variant="secondary">Reviews</LinkButton>
      </div>
      <Card>
        <CardHeader><CardTitle>Public staff profile content</CardTitle></CardHeader>
        <CardContent>
          <form action={updateClaimedStaffProfileAction} className="grid gap-4 lg:grid-cols-2">
            <input type="hidden" name="staffId" value={profile.staffId} />
            <div className="lg:col-span-2"><LocalizedField name="name" label="Name" value={profile.nameTranslations} requiredLocale="fa-IR" /></div>
            <div className="lg:col-span-2"><LocalizedField name="title" label="Professional title" value={profile.titleTranslations} /></div>
            <Field label="Specialty"><Input name="specialty" defaultValue={profile.specialty ?? ""} /></Field>
            <div className="lg:col-span-2"><MediaPicker name="profileImageUrl" providerId={claim.serviceProviderId} value={profile.profileImageUrl ?? ""} mediaType="image" label="Profile image" /></div>
            <div className="lg:col-span-2"><LocalizedField name="biography" label="Biography" value={profile.biographyTranslations} mode="richtext" /></div>
            <div className="lg:col-span-2"><Button type="submit">Save my profile changes</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
