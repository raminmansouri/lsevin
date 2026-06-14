import { getReferralPoliciesDataAction } from "../actions";
import { ReferralPoliciesPageClient } from "./ReferralPoliciesPageClient";

export default async function ReferralPoliciesPage() {
  const data = await getReferralPoliciesDataAction();

  return <ReferralPoliciesPageClient initialData={data} />;
}
