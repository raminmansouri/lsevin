# Payment gateways

This package adds an extendable payment-provider layer for booking payments and an admin-managed gateway configuration table.

## Admin pages

- `/[locale]/admin/payment-gateways` — list gateways, enable/disable each gateway.
- `/[locale]/admin/payment-gateways/zarinpal` — edit Zarinpal settings.

The settings are stored in:

```sql
booking.payment_gateways
```

A migration is included at:

```txt
src/payment/db/migrations/20260430_create_booking_payment_gateways.sql
```

The runtime repository also calls `create table if not exists` as a defensive fallback, but production deployments should run the migration explicitly.

## Zarinpal setup

Install the official SDK:

```bash
npm install zarinpal-node-sdk
```

Then configure Zarinpal from the admin page. These environment variables are still supported as fallback values:

```env
ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ZARINPAL_SANDBOX=true
ZARINPAL_CURRENCY=IRR
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`ZARINPAL_CURRENCY` supports `IRR` and `IRT`. If a booking is priced in another currency, the payment service uses `finance.convert_money(...)`; add the required exchange rates in the finance tables first.

## Runtime behavior

1. User clicks the enabled gateway button on the booking detail page.
2. `initiateBookingPaymentAction` checks that the gateway is enabled in `booking.payment_gateways`.
3. A row is created in `booking.payments`.
4. Zarinpal returns an authority and redirect URL.
5. Callback route verifies the payment and updates `booking.payments` and `booking.bookings`.

## Add another gateway

1. Add the gateway code to `PaymentGatewayCode`.
2. Create `src/payment/providers/<gateway>.ts` implementing `PaymentProvider`.
3. Register it in `src/payment/providers/index.ts`.
4. Add the gateway value to the server-action schemas.
5. Seed a row in `booking.payment_gateways`.
6. Add a callback route under `src/app/[locale]/api/payments/<gateway>/callback/route.ts`.
