import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function BookingFinancialActionLink({ bookingId }: { bookingId: string }) {
  return (
    <Button asChild size="sm" variant="outline">
      <Link href={`/admin/bookings/${bookingId}/financial`}>Financials</Link>
    </Button>
  );
}
