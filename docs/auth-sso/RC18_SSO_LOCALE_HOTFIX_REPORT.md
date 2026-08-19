# RC18 LSevin SSO and locale synchronization hotfix

## Decision

The checked RC18 migration/health hotfix did not yet implement LSevin SSO. It accepted a raw user UUID from a cookie/header and a development override. Its locale switcher wrote a host-only `NEXT_LOCALE` cookie, so the selected language was not reliably shared between `appmain.lsevin.com` and `providers.lsevin.com`.

This hotfix implements the missing integration in Providers Portal Core and supplies the required appmain patch.

## Authentication behavior

- Protected Providers Portal pages start a state-protected SSO flow.
- appmain reads its existing Auth.js session on its own origin.
- Already-authenticated LSevin users return immediately without entering credentials again.
- Guests use the existing appmain sign-in, sign-up and OTP pages.
- Registration and OTP preserve the original provider-portal return path.
- appmain returns a 90-second HMAC-SHA256 identity assertion containing only user UUID and locale.
- Providers Portal validates state, signature, issuer, audience, timestamps and the active `identity.asp_net_users` row.
- Providers Portal creates a 15-minute HttpOnly session. Expiry silently repeats SSO while appmain remains signed in.
- The old development user ID is ignored in production and no longer blocks startup.

## Locale behavior

- Login, registration entry, provider landing, staff landing and authenticated shell all expose the language switcher.
- Both applications write `NEXT_LOCALE` for `.lsevin.com`.
- Existing host-only locale cookies are expired before the shared cookie is written.
- Providers Portal persists authenticated changes to `identity.user_preferences.preferred_locale`.
- The eight existing LSevin locales remain unchanged.

## Security controls

- Random 256-bit state cookie
- HttpOnly/Secure/SameSite=Lax portal session
- Exact callback origin and path allowlist
- Local return-path validation
- Short-lived signed exchange token
- Constant-time signature comparison
- Active-user database verification
- No appmain access token or refresh token is exposed
- No production trust in a raw user-ID cookie

## Verification

- SSO/locale focused QA: 26/26
- Health route QA: 10/10
- Route architecture: passed
- Static architecture: 60 modules / 605 files
- Migration audit: 86 migrations; historical migrations immutable 84/84
- TypeScript syntax transpilation for every changed TS/TSX file: passed
- Cross-application HMAC contract and tamper rejection: passed

Full dependency installation, TypeScript semantic checking and production build could not be rerun in this environment because the internal npm registry returned HTTP 503 for `zod-4.1.12.tgz` on three attempts. The previous RC18 build evidence remains valid for the unchanged dependency graph, but this hotfix must be built in Jenkins after the package registry is available.

## Deployment order

1. Apply and deploy the appmain patch.
2. Configure the same random SSO secret in both applications.
3. Apply and deploy the Providers Portal hotfix.
4. Verify logged-in, logged-out, registration/OTP and all eight locale flows in a browser.
