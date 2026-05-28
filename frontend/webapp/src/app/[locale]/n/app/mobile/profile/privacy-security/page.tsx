import { getPrivacySecurityPageData } from "./queries";
import PrivacySecurityPageClient from "./PrivacySecurityPageClient";

export default async function PrivacySecurityPage() {
  const data = await getPrivacySecurityPageData();
  return <PrivacySecurityPageClient initialData={data} />;
}
