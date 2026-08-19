# Admin-to-provider feature map

| Admin capability | Provider portal module | Notes |
| --- | --- | --- |
| Manage service providers | `providers` | Provider can edit own profile only. |
| Manage provider services | `services` | Provider selects global service definition, then sets local price/name/duration. |
| Manage staff | `staff` | Phase one creates new staff and links it to provider. Future: search existing staff. |
| Manage provider gallery | `media` | Phase one supports URL. Future: use media library upload. |
| Manage availability | `availability` | Operating hours implemented; generic rules schema is ready. |
| Manage bookings | `bookings` | Provider can update provider notes and booking status. |
| Manage commercial side | `finance` | Reads ledgers and manages payout accounts. Compensation policies remain admin-owned. |
| Assign provider to user | `provider-access` | Owner/admin can add provider members. |
| Become provider | `onboarding` | Authenticated users can submit applications. |
