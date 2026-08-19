# LSevin SSO and locale synchronization

## Implemented flow

1. A protected Providers Portal route redirects to `/api/auth/start`.
2. The portal stores a random, HttpOnly SSO state and the validated local return path.
3. The browser is redirected to `appmain.lsevin.com/api/provider-sso/authorize`.
4. Because the browser is now on appmain, the existing Auth.js session cookie is available there.
5. If the user already has an active LSevin session, appmain immediately creates a 90-second HMAC-SHA256 exchange token and redirects to the portal callback.
6. If the user is not authenticated, appmain sends the user through its existing localized sign-in, sign-up and OTP pages. The original SSO authorization URL is preserved through every step.
7. The portal callback checks the state, signature, issuer, audience, timestamps and active `identity.asp_net_users` row, then creates a 15-minute provider session.
8. When the provider session expires, the same flow silently renews it while the appmain session remains active.

The portal never creates a second identity and never trusts an unsigned user ID in production.

## Required environment

### Providers Portal

```env
NEXT_PUBLIC_APP_URL=https://providers.lsevin.com
LSEVIN_APPMAIN_URL=https://appmain.lsevin.com
LSEVIN_PROVIDER_SSO_SECRET=<same random secret as appmain, at least 32 characters>
LSEVIN_SHARED_COOKIE_DOMAIN=.lsevin.com
PROVIDER_PORTAL_DEV_USER_ID=
```

### appmain webapp

```env
PROVIDER_PORTAL_ORIGIN=https://providers.lsevin.com
PROVIDER_PORTAL_SSO_SECRET=<same random secret as provider portal, at least 32 characters>
NEXT_PUBLIC_LSEVIN_COOKIE_DOMAIN=.lsevin.com
```

Generate the shared secret once:

```bash
openssl rand -base64 48
```

Do not expose this secret through a `NEXT_PUBLIC_` variable.

## Language synchronization

Both applications use the same locale set and `NEXT_LOCALE` cookie. The cookie is written for `.lsevin.com`, so a language change on one subdomain is visible to the other.

The Providers Portal also persists authenticated language changes to `identity.user_preferences.preferred_locale`. Existing host-only `NEXT_LOCALE` cookies are expired before the shared-domain cookie is written to avoid duplicate-cookie ambiguity.

Supported locales:

- `fa` / `fa-IR`
- `en` / `en-US`
- `ar` / `ar-SA`
- `tr` / `tr-TR`
- `es` / `es-ES`
- `ku` / `ku-KU`
- `de` / `de-DE`
- `fr` / `fr-FR`

## Production behavior of the old development override

`PROVIDER_PORTAL_DEV_USER_ID` is now read only when `NODE_ENV` is not `production`. A stale production value is ignored and logged as a warning; it is no longer a startup blocker or an authentication source.
