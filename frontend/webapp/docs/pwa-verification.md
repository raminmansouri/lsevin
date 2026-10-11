# PWA implementation and release verification — 2026-10-12

## IMPLEMENTED

Installable manifest, existing-brand icons, versioned service worker, bounded
static caching, bilingual offline reader, update consent and storage recovery.
Previously visited landing, provider, specialist/staff, service and discovery
pages are saved as guest-only text reading views. A small public provider
directory supports offline search. An explicitly saved profile contains only
encrypted name/email and requires its passphrase to unlock. Profile ciphertext
expires and is cleared on confirmed sign-out/account changes.

Offline writes reject before optimistic updates and are never replayed on
reconnection. Bookings, payments, account edits, medical records and unvisited
pages require a connection. Android and iOS retain their existing native
WebViews, use remembered trusted origins for warm offline startup, and protect
profile/wallet routes against cross-domain failover. iOS uses App-Bound Domains.
See [pwa.md](pwa.md) for limits, retention and deployment details.

## ROOT CAUSE

The prior worker handled push notifications without offline caching or an
offline reader. Native startup waited for network/domain health checks before
loading the WebView. React Query's default mutation behavior could pause
offline writes and replay them after reconnecting.

## VERIFIED

- Node security/offline behavior tests: 7/7 PASS.
- Persistent Playwright fixture tests: 32/32 PASS, desktop and Pixel 7 Chromium.
  These serve the actual worker/reader/crypto modules; catalogue/auth data are
  fixtures and do not validate the database. Storage quota/read failures are
  explicitly injected into the worker, not measured real-device quota limits.
- Real Next production standalone suite: 2 PASS, 2 FAIL, no skips. Manifest,
  response headers, guest authentication/protected redirect and automatic
  landing-page offline reading passed. Catalogue request returned HTTP 500
  with database EACCES/connection errors. Real test-password login and OTP
  verification succeeded against the live API and produced a valid local
  NextAuth session. The authenticated profile page then rendered the existing
  application error screen because its direct PostgreSQL read failed, so the
  offline form/save/unlock/logout workflow could not pass.
- Playwright MCP exercised actual landing-page offline refresh and saved text,
  and fixture Persian RTL rendering/search without horizontal overflow.
- Scoped `tsconfig.pwa.json`: PASS. PWA/react-query lint: PASS. Changed PWA
  source formatting and relevant `git diff --check`: PASS.
- Production build of the isolated candidate based on upstream `7f4f03e8`:
  PASS, 2007 static pages generated. Build used temporary HTTPS
  `NEXT_PUBLIC_URL=https://lsevin.ir` and the live API URL; no environment file
  was modified. C: was full and concurrent verification exhausted memory in
  initial attempts. The passing run used temporary files on E:, stopped owned
  completed verification processes, and `NODE_OPTIONS=--max-old-space-size=4096`.
  Database-dependent build fetches logged failures/fallbacks. Existing Next
  configuration skips full type checking during builds.
- Full project typecheck on the isolated candidate: FAIL, 614 errors in
  unchanged modules; none in changed PWA files.
  Broader touched-profile lint: two existing app-component boundary errors and
  four unused warnings. These are not included in the scoped PASS above.
- Android debug build and unit tests: PASS, 9/9 tests.
- Android release build, R8 and release-critical lint: PASS. Full debug lint:
  PASS, zero errors and 25 warnings. APK signature verification: PASS (v2).
- Android 16 / WebView 133 emulator instrumentation: 2/2 PASS. The actual
  MainActivity WebView saved text, survived destruction/recreation, and read
  it with all fixture network connections closed; offline refresh also passed.
  Test setup cancels queued startup health navigation to isolate the fixture.
  This does not prove physical-device or process cold startup on live domains.
- Signed APK version 1.1 / code 2: installed as an in-place emulator update and
  MainActivity launched successfully. SHA-256:
  `880e1f778374ed81b11fd65a18f9fcbdf6eafbb7c2c8a2853a9a7f385e49043d`.
- iOS plist syntax and trusted App-Bound Domains: PASS (static validation).
- Configured PostgreSQL connector: read-only connectivity PASS, PostgreSQL
  17.10 and 168 providers. Direct Node/appsettings database connections failed
  with authentication/network errors. Connector access does not validate the
  application's connection or its user workflow. Docker daemon was unavailable.
- Merged PWA source into `Lsevin-New`: `6937d50309dc4e11501011acb50c4d68422bb276`.
  Initial global Jenkins build 303: SUCCESS. Follow-up build 304: SUCCESS,
  running image `lsevin-webapp:c72add8aa572-304`,
  ready 1/1; deployed worker and offline reader verified inside the pod and over
  HTTPS. Chrome upgraded its previous push-only worker, then disconnected
  Providers link navigation and refresh opened the offline reader.
- Live global production public browser suite: 4/4 PASS, including
  manifest/worker/header/guest-auth, startup while a nonessential image remains
  pending, landing snapshots, and real provider/service/staff offline direct
  navigation and refresh. Cold/slow document recovery uses the actual reader's
  Try again control. Authenticated profile workflow: 1/1 PASS separately.
  Authenticated profile save, offline unlock, hydration-aware sign-out and
  ciphertext clearing: PASS with the real backend/test user.
- Live catalogue QA exposed browser HTTP-cache reuse of SSR staff HTML while
  disconnected. Follow-up document fetches use `cache: no-store`. The new
  regression fails with previous behavior and passes with the correction;
  fixture browser suite now 34/34 PASS. Registration now starts at DOM readiness,
  without waiting for slow images. Follow-up production navigation/refresh and
  real worker update preserving saved pages: PASS. Linux build worker revision
  `v1-020c71f0b9e258e6`, SHA-256
  `83bbef58b2bdfb643eca57314bbf8a1a67f797ec1e74860afdca698eb286eb49`.
  Global build 305: SUCCESS for Jenkinsfile-only commit `489fa806`; it correctly
  retained build 304's image because application source did not change.
- Server B SSH connectivity succeeds when bound to the Ethernet source address,
  bypassing the local TUN without changing routes. Its first full-history checkout
  was slow; Jenkins config was backed up and changed to a single-branch shallow
  checkout plus a verified Git reference cache transferred over SSH. Its initial
  Jenkinsfile attempted to delete a bind mount; the workspace now uses a child
  directory and its existing Iran site-variant script runs before image import.
  Iran build 4 passed checkout, source integrity, preflight and production build,
  including the Iran image variant, but import failed because the archive's
  controller path was not shared with the host. The helper now defaults to the
  shared `/var/lib/lsevin/releases`. Real Jenkins-to-host import regression:
  PASS, using a temporary tag of the existing helper image, without deploying
  an application or touching its database. Iran build 5 is compiling.
  Iran still runs its previous image; deployment remains pending.
- Intermittent public Cloudflare HTTP 503 responses were observed during the
  earlier live run. Direct origin offline-reader HTTP 200 and application log
  classifications showed no corresponding errors. The later public suite passed;
  repeated CDN resilience and physical-device behavior remain unverified.

- Follow-up `b692d990` pushed to `Lsevin-New`: atomic shell installation now
  retries transient failures; supported public reading pages use the reader
  when document requests return HTTP 500/503. HTTP 403/404 and network-only
  APIs retain their original semantics. Fixture suite: 40/40 PASS, desktop
  and mobile Chromium; scoped PWA TypeScript: PASS. Previous HTTP 5xx behavior
  was reproduced as a failing regression before the correction. Jenkins global
  308 and Iran 9 are building; this follow-up is not yet verified deployed.

## NOT VERIFIED

Live push delivery, payments returning to the updated wrappers, staging,
Latest follow-up production deployment, repeated CDN resilience and installation/update
on real devices.
No macOS/Xcode is available: iOS compilation and runtime remain unverified.
Android airplane-mode process cold startup, OS storage eviction and
instrumentation remain unverified on physical devices.
The tested Chromium Pixel 7 emulation is not an Android WebView or iOS test.
The global Linux containers were built and deployed by Jenkins 303/304;
Iran build 7 deployed successfully; latest follow-up deployment and its
both-domain verification remain pending.

## DATABASE / MIGRATIONS

No schema changes or migrations added/executed for this feature. Connector
queries were read-only. Real test login/OTP verification used the existing
backend and its normal authentication persistence; no manual database changes
were made. Previous production migration state
was read on server B: migrations 0070/0071 are already applied, and 0071's
checksum matches the current Git blob. Its meal-plan table exists. No migration
upgrade is required by these PWA changes.
Other pre-existing repository migrations and user changes were left intact.

## REGRESSION TESTS

`tests/pwa.test.mjs`, `e2e/pwa.spec.ts`, `e2e/pwa-app.spec.ts`, and Android
`OfflineStartupTest.kt`. Cover private-route/data exclusion, bounded retention,
guest-only extraction, partial streams/cancellation, wrong-passphrase/tampering,
logout races, no offline mutation replay, slow-network fallback, update consent,
cache eviction/storage errors, RTL, and network-only APIs/payment/downloads.
`deployments/jenkins/tests/import-smoke.sh` checks the actual Docker/K3s archive
boundary from inside Jenkins and cleans up only its own temporary image tag.

## DEPLOYMENT REQUIRED

Complete global build 308 and Iranian build 9, then verify the exact new
worker and repeat the real authenticated/public suites on both hosts; keep
public/static files in the standalone runtime.
Use valid HTTPS build origins and preserve worker no-store/CSP/scope headers.
Build, device-test and publish updated Android/iOS apps through the existing
release process. No new secrets, queues, schema or external services required.
Run actual-app tests with a representative test database and authenticated test
state, then staging and both-domain/device smoke checks. Global initial deployment
and previous follow-up completed; Iran build 7 deployed. The latest follow-up
is still building on both servers.
Native sources were pushed to private repositories
[Android](https://github.com/Mohammadjafariyan/Lsevinandroid) (`712e9b9`) and
[iOS](https://github.com/Mohammadjafariyan/lseviniosapp) (`8c84274`).
Webapp changes were merged and pushed to `Lsevin-New` from an isolated release
checkout, preserving unrelated local work. APK delivery is local at
`E:/jafariyan/workplace/lsevin/releases/LSevin-Android-1.1.apk`.
Existing credentials and appsettings files were left unchanged as requested.

## RISKS

Offline views are saved text, not fully interactive copies of every page.
Saved public data can be stale, partial, expired or evicted. Private profile
availability is optional and limited to name/email, not full profile records.
Each origin keeps separate sessions/storage; saved data does not transfer
between Iranian/global hosts. Existing full typecheck/lint failures and missing
database/native/staging verification prevent release approval.

## RELEASE STATUS

**NOT READY FOR RELEASE**
