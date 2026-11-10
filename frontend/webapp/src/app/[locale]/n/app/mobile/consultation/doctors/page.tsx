import { VideoDoctorsPage } from "@/features/consultation/components/video-doctors-page";

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? null;

export default async function MobileConsultationDoctorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  // The "consult before treatment" button sends a provider with several doctors here.
  const bookQuery = new URLSearchParams();
  const service = first(query.service);
  const source = first(query.source);
  if (service) bookQuery.set("service", service);
  if (source) bookQuery.set("source", source);
  return (
    <VideoDoctorsPage
      providerId={first(query.provider)}
      staffId={first(query.staff)}
      bookQuery={bookQuery.toString() || undefined}
    />
  );
}
