import { PrivacyPolicyContent } from "@/features/legal/components/privacy-policy-content";

export const dynamic = "force-dynamic";

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent backHref="/n/app/mobile/profile" />;
}
