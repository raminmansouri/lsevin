import 'server-only';
import db from '@/config/database/db';
import { pickTranslation } from '../utils/translation';

export interface CartBooking {
  id: string;
  service: string;
  provider: string;
  amount: number;
  currency: string;
}

export async function listCartBookings(userId: string, locale: string): Promise<CartBooking[]> {
  const rows = await db`
    select d.id, d.total_amount, d.currency,
           sd.name_translations as service_name, sp.name_translations as provider_name
    from booking.booking_drafts d
    left join category.provider_services ps on ps.id = d.service_id
    left join category.service_definitions sd on sd.id = ps.service_definition_id
    left join category.service_providers sp on sp.id = d.provider_id
    where d.user_id = ${userId} and d.status in ('Draft', 'InProgress')
      and coalesce(d.metadata, '{}'::jsonb) ? 'cartSavedAt'
    order by d.updated_at desc, d.id
  `;
  return rows.map(row => ({
    id: String(row.id),
    service: pickTranslation(row.service_name, locale),
    provider: pickTranslation(row.provider_name, locale),
    amount: Number(row.total_amount ?? 0),
    currency: String(row.currency || 'USD'),
  }));
}

export async function saveBookingToCart(userId: string, draftId: string): Promise<void> {
  const rows = await db`
    update booking.booking_drafts
    set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('cartSavedAt', now()),
        updated_at = now()
    where id = ${draftId}::uuid and user_id = ${userId}
      and status in ('Draft', 'InProgress') and provider_id is not null and service_id is not null
    returning id
  `;
  if (!rows.length) throw new Error('BOOKING_DRAFT_NOT_EDITABLE');
}

export async function removeBookingFromCart(userId: string, draftId: string): Promise<void> {
  const rows = await db`
    update booking.booking_drafts set status = 'Cancelled', updated_at = now()
    where id = ${draftId}::uuid and user_id = ${userId}
      and status in ('Draft', 'InProgress')
      and coalesce(metadata, '{}'::jsonb) ? 'cartSavedAt'
    returning id
  `;
  if (!rows.length) throw new Error('BOOKING_DRAFT_NOT_EDITABLE');
}
