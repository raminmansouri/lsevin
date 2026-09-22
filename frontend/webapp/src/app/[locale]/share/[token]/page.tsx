import { ShareView } from "@/features/patients/components/share/share-view";

type Props = {
  params: Promise<{ token: string }>;
};

// V5.3: "Prevent indexing by search engines." A random opaque token in the
// URL already keeps it unguessable (spec: "prevent public predictable
// URLs"); this keeps it out of search results too if one ever leaks into a
// crawlable page.
export const metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function SharedRecordPage({ params }: Props) {
  const { token } = await params;
  return <ShareView token={token} />;
}
