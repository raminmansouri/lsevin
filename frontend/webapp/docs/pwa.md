# Offline application behavior

Cached public pages open in the real application UI, using saved guest HTML,
Next.js bootstrap, CSS, fonts and images. The application must first be opened
online. After a page's background cache completes, navigation and refresh work
offline; client controls that use already loaded data remain available. Unsaved
pages require internet and stay within the application when reached from it.
Bookings, payments, edits, private APIs, medical records, downloads and server
mutations remain online-only. Requests are never queued for later replay.

The profile overview automatically saves its rendered UI for 24 hours using an
account-bound nonextractable AES-GCM key in IndexedDB. CacheStorage contains
ciphertext, not plaintext identity details, photos or scripts. Its original CSS
is public and cached separately. Tokens and Next's authenticated server payload
are never saved. Sign-out and confirmed account changes clear the overview and
its device key. Offline availability is local device access, not server-side
proof of authorization; a disconnected device cannot learn about server
revocation until it reconnects. Do not use the saved view for authorization.

Public documents: 24 entries, max 4 MiB each, 24-hour expiry; do not redownload
within five minutes. Public bootstrap assets: bounded shared cache of 128
entries, individual limit 4 MiB. Guest image URLs: 96 entries; warm at most 64
per page in batches of four (eight with data-saver/2G). Anonymous image requests
omit credentials. Opaque external image sizes cannot be inspected. Old text
snapshots remain compatible with legacy workers but are not normal navigation
for application documents. Browser quota failures never block live requests.

## Published app stores

Edit src/config/app-stores.ts and fill the listing URL for each published store.
Blank, invalid, non-HTTPS or credential-bearing URLs are hidden. Add additional
stores with a name, platform (android or ios) and HTTPS listing URL. Optional
region iran/global limits visibility to lsevin.ir/global hosts. Without region,
a store is available on both. All defaults are blank, including Google Play.
There is no APK fallback and no generic Install LSevin button. Configured links
appear in regular browsers; embedded native WebViews and installed standalone
apps do not promote downloading an app the user is already running. Rebuild and
redeploy from Lsevin-New after modifying these static settings.

## Release verification

See pwa-verification.md for actual executed checks and outstanding release gates.
