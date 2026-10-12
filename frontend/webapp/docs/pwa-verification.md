# Offline application UI verification - 2026-10-12

## IMPLEMENTED

Public landing/home, providers, provider, staff/specialist and service pages use
complete guest application documents with their Next.js bootstrap, CSS, fonts
and public images. Cached pages retain the application layout and client-side
controls instead of opening the separate text reader. Offline anchor/button
navigation uses cached document loads. Unsaved routes return to a cached home;
connection-dependent actions stay in the application and require a connection.

The profile overview automatically saves a sanitized rendering, encrypted with
an account-bound, nonextractable AES-GCM device key in IndexedDB. No session/RSC
scripts, tokens, forms or medical-record routes are persisted. Profile photos
are embedded inside the encrypted record. Existing styling, statistics and menu
are preserved; offline menu navigation works for cached pages. Sign-out,
confirmed account changes and 24-hour expiry invalidate the private view.

Cold offline startup initializes React Query's connection state before queries
mount, preserving initial data without immediate failing network refetches.
Mutations remain guarded and are never queued for replay.

Store buttons use configured published URLs in src/config/app-stores.ts.
All URLs start empty: no install/download button is shown. Android/iOS native
WebViews and installed standalone apps hide configured store links as well.
Desktop browsers see configured stores; mobile browsers filter by platform.
Optional region filters distinguish Iranian and global hosts. There is no
Google Play or APK fallback. Existing credentials/appsettings are unchanged.

## ROOT CAUSE

The previous implementation deliberately extracted text into a separate offline
reader. It discarded layouts, images, application controls and fonts, so it did
not meet the required online/offline visual continuity. Next.js documents need
their bootstrap and public assets to hydrate offline. A newly opened offline
browser document also receives no initial offline event; React Query otherwise
starts in an online state and can replace cached data with network errors.

## VERIFIED

- Persistent fixture Playwright: 52/52 PASS on desktop and Pixel 7 Chromium.
- Pixel-identical fixture online/offline screenshots, real cached CSS/images,
  offline client tabs/search, link navigation, refresh and back/forward: PASS.
- Profile encryption, nonextractable key, tampering, account changes, session
  infrastructure failure, local sign-out, expiry and offline refresh: PASS.
- Guest documents omit cookies and never save signed-in fixture markup: PASS.
- Node safety/store-link/cold-query tests: 10/10 PASS.
- Scoped PWA TypeScript: PASS. Changed production-source lint: PASS; the existing
  use-navigate signature has two pre-existing warnings. Git diff checks: PASS.
- Worker preparation is deterministic across repeated runs. Shared private-store
  code is bundled into the worker, removing an extra importScripts failure point.
- Playwright MCP inspected the real local Next.js landing and refreshed offline:
  normal application sections and layout returned, with no saved-text reader.
  That local database is inaccessible, so it does not validate real catalogue
  data or authenticated profile integration. Hydration requires a bounded wait.
- Local Next compilation produced the standalone artifact and route listing
  using --no-lint and a valid HTTPS build origin. It returned a nonzero process
  status with existing database EACCES failures; this is not a passed full build.
- The normal local build failed on existing full-repository boundary lint errors
  in unchanged modules. Scoped changed-source lint passed. Linux CI and real
  production verification of the exact final candidate are still required.

## NOT VERIFIED

Final-candidate global/Iran builds, deployments, real authenticated/public
browser suites and real-device visual comparisons are pending. Published store
URLs are not yet supplied; defaults correctly display none. iOS compile/runtime,
physical Android cold startup and OS eviction, live push/payment returns and
staging remain unverified. Previous full typecheck had 614 existing errors.

## DATABASE / MIGRATIONS

No schema changes or new migrations. No data-changing migration is required.
The earlier read-only Iranian production inspection confirmed 0070/0071 applied
and the 0071 checksum matched Git. Exact-candidate deployment/health verification
is still pending. Real test authentication is the only intended persistent
backend interaction during browser QA.

## REGRESSION TESTS

New e2e/pwa-ui.spec.ts covers visual continuity, cold offline document navigation,
client tabs/search, guest-only document caching and private-view security.
Existing e2e/pwa.spec.ts retains installation, update, quota/eviction, expiry,
network-only APIs/payments and legacy-reader compatibility checks.
e2e/pwa-app.spec.ts now checks real application layouts, saved public routes,
automatic encrypted profile views, sign-out and absent unconfigured store links.
tests/pwa.test.mjs adds platform/region/store-URL validation and an actual
React Query observer proving cold offline refetch pauses while cached data stays.

## DEPLOYMENT REQUIRED

Push/redeploy from Lsevin-New on both servers and verify the exact worker/source
in the running pods. Retain public/static resources in the standalone image.
Open the updated app online once to populate application documents; apply an
available worker update. Fill only published store URLs in app-stores.ts and
redeploy when those listings become available. No new secrets, configuration
values in appsettings, schema, queues or external services are required.

## RISKS

Offline content can be stale, partial in coverage or evicted by the OS. Public
screens are guest responses: server-only personalized state is not persisted.
The private overview is a styled local view, with server-dependent controls
requiring connectivity. Clinical/financial records and unsaved pages are not
made available offline. Static/public-image caches are bounded; opaque external
image sizes cannot be measured. Each origin retains separate sessions/storage.
Unverified real deployment/native behavior and existing baseline build checks
prevent release approval.

## RELEASE STATUS

**NOT READY FOR RELEASE**
