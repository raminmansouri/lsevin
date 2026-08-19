# Batch 10 — LSevin SSO, Locale Sync, and Booking Journey

## Cross-subdomain SSO

Providers Portal no longer attempts to infer authentication from the main platform's host-only Auth.js cookie. Protected provider/staff routes redirect through the main platform bridge. The bridge reads the existing `appmain.lsevin.com` Auth.js session, issues a signed `lsevin_provider_sso` cookie scoped to `.lsevin.com`, and returns to the original Providers Portal URL.

If no main-platform session exists, the bridge sends the user through the existing LSevin sign-in page. The sign-up link and registration OTP flow preserve the same bridge return path, so new users also return to the requested Providers Portal page after authentication.

Production setup: set the same high-entropy `LSEVIN_SSO_SECRET` in both applications. Main-platform fallback to `AUTH_SECRET` is migration compatibility only; a dedicated shared SSO secret is preferred.

## Locale synchronization

Both applications write `LSEVIN_LOCALE` on `.lsevin.com` while retaining their local `NEXT_LOCALE` cookie. Providers Portal reads the shared locale first. The main platform middleware also prefers the shared locale. Providers Portal uses a globe/dropdown switcher on the public entry header and authenticated shell.

The public onboarding landing body still contains legacy English copy and remains in the multilingual backlog; this batch synchronizes locale behavior and the shared shell, not every historical onboarding string.

## Booking journey

Canonical Booking Management now uses owned booking selectors instead of raw booking UUID inputs. Provider users can see documents from their own bookings. Staff can see documents only when the booking has an active assignment to that exact provider/staff pair. The source of truth remains `booking.booking_documents`; no duplicate booking/document schema was introduced.

Non-web storage paths are not exposed directly. Protected document streaming remains a follow-on item for private storage references.
