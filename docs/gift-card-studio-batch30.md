# Batch 30 — Gift Card & Voucher Studio

## Customer value
Gift Card & Voucher Studio adds a prepaid revenue and gifting channel for clinics, salons, spas, gyms, dental providers, wellness businesses, corporate wellness programs and promotional voucher campaigns.

## Delivered workflow
1. Provider configures a moderated gift profile and gift products.
2. Customer purchases a gift card, voucher, prepaid credit, experience gift or corporate wellness credit.
3. Optional invoice/payment request is issued through the Core ModuleBus billing capability.
4. Recipient claims using a voucher code transported only by `x-lsevin-voucher-code`.
5. Provider redeems value atomically against available balance and redemption limits.
6. Purchaser or recipient can request delivery, transfer, refund, cancellation, decline or help.
7. Admin supervises pending payment, unclaimed, expiring, refund-requested, blocked and high-balance gifts.

## Architecture
- Module folder: `src/modules/gift-card-studio`
- Dependency: Core only
- Database schema: `gift_card_studio`
- Public route: `/providers/:providerId/gifts`
- Provider route: `/providers/:providerId/gift-card-studio`
- Admin route: `/admin/gift-card-studio`
- Readiness key: `gift_card_studio_ready`

## Security and financial safeguards
- Purchaser access token, recipient access token and claim code are stored only as SHA-256 hashes.
- Protected APIs use `x-lsevin-gift-token`.
- Claim API uses `x-lsevin-voucher-code`.
- Raw secrets are excluded from URLs and protected JSON request bodies.
- Partial redemption is atomic and cannot exceed balance, validity or redemption limit.
- Transfer rotates claim code and invalidates prior recipient token.
- Internal provider notes are excluded from public/customer DTOs.
- Billing handoff fails closed if the optional billing capability is unavailable.
