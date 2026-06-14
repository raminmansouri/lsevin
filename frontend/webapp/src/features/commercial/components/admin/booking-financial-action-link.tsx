import { useTranslations } from "next-intl";
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function BookingFinancialActionLink({ bookingId }: { bookingId: string }) {
  const tAdmin = useTranslations("AdminGenerated");
  return (
    <Button asChild size="sm" variant="outline">
      <Link href={`/admin/bookings/${bookingId}/financial`}>{tAdmin("financials")}</Link>
    </Button>
  );
}
