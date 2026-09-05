import EditProfileForm from "@/features/profile/components/edit-profile-form";
import { getProfileForEdit } from "@/features/profile/actions/profile.actions";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const profile = await getProfileForEdit();
  return <EditProfileForm initialData={profile} />;
}
