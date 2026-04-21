import EditProfileForm from "@/features/profile/components/edit-profile-form";
import { getProfileForEdit } from "@/features/profile/actions/profile.actions";

export default async function EditProfilePage() {
  const profile = await getProfileForEdit("en-US");
  return <EditProfileForm initialData={profile} locale="en-US" />;
}