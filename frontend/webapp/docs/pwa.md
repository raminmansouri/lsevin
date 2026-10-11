# LSevin PWA and offline behavior

The same origin-relative manifest and service worker work on `lsevin.ir` and
`lsevincare.com`. Each origin has its own installation, cookies, keys and cache;
saved information does not transfer between the Iranian and global sites.

## User workflow

1. Open a page while connected. After initial load, the worker installs the
   small offline reader. On a normal connection, a guest reading snapshot of
   each visited public page is saved after four seconds. Further snapshots of
   that page are limited to one every 30 minutes. Data Saver/2G skips this
   optional background download.
   Guest streams are capped at 2 MiB. A deadline/network interruption can retain
   available reading text, explicitly marked as a partial page; deliberate
   navigation cancellation does not save it.
2. Previously visited landing, provider directory/detail, specialist/staff
   detail, service detail and discovery pages can be read offline. These are
   **text reading views**, not replicas of the interactive online screens.
   A small directory of up to 60 recently encountered providers per language
   is also available, starting with 20 providers fetched after installation.
3. Offline navigation/refresh opens the independent reader. Search saved
   information, expand a saved page, or retry the original URL after reconnecting.
   New/unvisited pages require a connection. A stalled document request falls
   back after eight seconds; actual HTTP errors are preserved.
4. On mobile or desktop Profile, optionally save the name and email with a
   separate passphrase of 10–128 characters. Open Profile offline and enter that
   passphrase to read them. Data is encrypted with AES-256-GCM and a
   PBKDF2-SHA256 key (210,000 iterations, random salt and IV). No key or plaintext
   is persisted. Sign-out, account switching, clearing saved information and
   expiry invalidate the snapshot. Unlocked views relock on refresh, hiding
   the tab, or clearing data in another tab.
5. Bookings, payments, authentication, profile edits, medical records, results,
   wallets and other account workflows require the server. Mutations are not
   queued or replayed, and no success is shown for an offline transaction.

## Storage and security

- No raw HTML, RSC, sessions, access/refresh tokens, account API responses,
  uploads, live price/availability APIs or financial pages enter the worker cache.
  Public reading text can contain old advertised prices; it is marked as saved
  information and cannot be used to submit a booking or payment.
- Public snapshots use a new `credentials: omit` guest request, discard scripts,
  forms/navigation and persist plain reading text. Route eligibility is an
  explicit allowlist in `src/lib/pwa/public-snapshot.ts`.
- Directory records use an explicit public-field projection; new fields in the
  provider API cannot silently enter offline storage. Render with `textContent`.
- At most 36 public reading snapshots (16,000 text characters each), 60 provider
  records per language, and 64 runtime assets of at most 1 MiB each are retained.
  Public pages expire after 24 hours, directory records after seven days, and
  encrypted profile records after 24 hours. Storage can be evicted by the OS.
- Asset cache writes happen in the background and cannot block successful online
  responses. Storage/registration failures leave the online application usable.
  Public asset keys discard request headers so Authorization values cannot enter
  storage. Invariant shell/static assets ignore proxy encoding/language `Vary`
  headers; online API responses keep their original behavior.
  If offline files are evicted, a small dependency-free fallback explains the
  missing storage. The shell is restored on the next successful online startup.
- React Query rejects offline mutations before optimistic updates or requests.
  Mutation defaults bypass its automatic offline pause/resume and disable retries,
  so booking/payment intent is not silently replayed after reconnecting.
- `scripts/prepare-pwa.mjs` derives a deterministic worker/cache revision from
  the worker and offline assets before both build modes. Changed releases wait
  for the user's **Update and reload** action; unchanged builds reuse the cache.
  Old LSevin worker caches are removed at activation, while public snapshots are
  retained subject to their expiry. Unrelated caches are untouched.
  The first PWA installation replaces the previous push-only worker without
  forcing a reload; subsequent PWA upgrades wait for update consent.
- Push and notification-click handlers remain in the same worker.
- API/payment callback and download navigations stay network-only. The worker
  cannot replace a failed callback or private file with a successful HTML page.

## Installation and mobile wrappers

Chromium offers an Install LSevin button when its installation event is available.
In iPhone Safari use Share → Add to Home Screen. HTTPS is required outside
localhost. Manifest icons reuse the existing native LSevin logo with a maskable
safe area; Apple touch icons and standalone metadata are included.

Keep the existing native wrappers. Both already use persistent browser storage;
a rewrite into a different shell is unnecessary for this offline reading scope.
Android startup/retry allows the remembered origin to load without a network
health gate. iOS uses a persistent WKWebView with App-Bound Domains for worker
support and opens the remembered origin before probing alternatives. Account
and wallet failures never switch origins. Existing external-link/payment routing
remains in the system browser. Device testing is required; desktop WebKit is not
proof of WKWebView behavior.

## Local checks

Run from `frontend/webapp`:

```powershell
node --test tests/pwa.test.mjs
pnpm exec tsc --project tsconfig.pwa.json
node ../../node_modules/@playwright/test/cli.js test --config playwright.pwa.config.ts
node ../../node_modules/@playwright/test/cli.js test --config playwright.pwa-app.config.ts
pnpm build:production
```

The Playwright fixture suite serves the actual worker/reader/crypto and public
snapshot module over HTTP and tests real CacheStorage and browser offline mode.
Its catalogue is fixture data: it does **not** prove the application's database,
authentication, or actual catalogue pages work. The separate `pwa-app` suite
must run against a production webapp with a representative test database.
Set `E2E_BASE_URL` for an existing staging origin and `PWA_E2E_STATE` to a real
test user's saved Playwright authentication state to exercise Profile. Without
that state, the authenticated test is explicitly skipped, not counted as verified.
Alternatively provide `PWA_E2E_PHONE` and `PWA_E2E_OTP` for a real, active test
challenge created by the existing login workflow. The test authenticates through
the actual NextAuth callback and verifies the session before opening Profile.
Keep credentials, storage states and traces outside Git. Runtime API/database
configuration must match the test environment.
The local application suite packages and starts the standalone server with the
same `public/` and `.next/static/` layout as the Docker runtime.
On Windows the local runner normalizes Next's generated directory-package links
to junctions inside the standalone artifact; it never modifies source dependencies.

## Deployment and remaining release gates

No schema migration, new secret, queue or external integration is required.
Rebuild and redeploy the webapp and both native applications. Keep `public/`
inside the standalone Docker image, as the existing Dockerfile already does.
Do not bypass Next's `/sw.js` no-store headers with a proxy/CDN rule. Verify
`/manifest.webmanifest`, `/sw.js`, `/offline.html` and `/pwa/*` on both hosts.
Use an HTTPS origin for `NEXT_PUBLIC_URL` at production build time.

Before release, execute the full static/build gates, actual application E2E with
the representative database and user roles, staging smoke checks, both-domain
installation/update checks, push checks, and real Android/iOS airplane-mode
cold startup, refresh, account switching, sign-out and external payment return.
Offline reading is intentionally limited to saved public views and the minimal
encrypted profile; complete offline editing or medical-data access requires a
separate authorization, synchronization and conflict-resolution design.

References: [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps),
[MDN service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers),
[WebKit App-Bound Domains](https://webkit.org/blog/10882/app-bound-domains/).
