import { getPrivacySecurityPageData } from "./queries";
import PrivacySecurityPageClient from "./PrivacySecurityPageClient";

export const dynamic = "force-dynamic";

export default async function PrivacySecurityPage() {
  const data = await getPrivacySecurityPageData();
  return <PrivacySecurityPageClient initialData={data} />;
}
