import Link from 'next/link';
import { WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BookingPaymentTermsActionLink({ bookingId }: { bookingId: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={`/admin/bookings/${bookingId}/payment-terms`}>
        <WalletCards className="mr-2 h-4 w-4" />Payment terms
      </Link>
    </Button>
  );
}
