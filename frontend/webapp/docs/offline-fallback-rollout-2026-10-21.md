# Offline fallback rollout — 2026-10-21

The previous fix was on a separate branch, not Lsevin-New. The public Iranian
CDN also served the retired offline.js at its unversioned URL after the origin
changed. The correction is now on Lsevin-New. Offline HTML references versioned
script/style URLs; service-worker installation fetches the entire shell using
a release-specific CDN query and normalizes cache keys after atomic addAll.
Temporary versioned cache entries are removed to avoid duplicate storage.

A reversible static-file hotfix was applied to the existing ready web pod on
both servers without an image build or restart. Original public files and
worker were backed up under /var/lib/lsevin/offline-branding-backups. The
container image itself is unchanged; future images obtain the committed fix.
Iranian and global live Playwright MCP checks showed the new logo/message,
zero directory/profile forms, and successful offline shell refresh. Iran was
also checked with actual test-transport network loss. App health remained 204.
No database, migrations, appsettings, credentials, or APK changes.

Already-open clients can retain the old active worker until update activation.
Close all application tabs/WebViews and reopen online, or accept Update and
reload when offered. Do not clear site data as that deletes saved pages.

Full candidate image rollout and physical Android/iOS validation remain
unverified. Static hotfix can be lost if the old image restarts before a
new committed image is rolled out.
