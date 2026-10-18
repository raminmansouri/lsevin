# Branded offline fallback — 2026-10-18

Removed the saved-pages directory, raw-text cards, search, clear controls, and
legacy passphrase form from the final navigation fallback. Complete cached
application documents and encrypted profile views retain their existing priority.
When no complete page is available, show the local Lsevin logo, a connection
message, and retry. Persian text and RTL are supported. Retry preserves the
requested URL and query; direct offline.html opens the locale home.

Verification executed: 58/58 desktop/mobile fixture Playwright tests, 12/12
PWA safety tests, scoped PWA TypeScript, formatting, diff checks, and a manual
390x844 Chrome screenshot inspection. Browser MCP was attempted but blocked
by a browser profile already in use; standalone Playwright ran successfully.

The six affected files were unchanged upstream before applying this patch onto
the current Lsevin-New revision. Newer booking/checkout work is preserved.
No database schema, migrations, credentials, appsettings, or native app changes.

Production rollout, physical Android/iOS verification, and production-like
integration are not verified for this patch. Production deployment must preserve
the repaired /app-health route and use a builder with verified capacity/isolation.
Existing clients need the new service worker installed and activated; the generated
worker revision is updated. Do not claim this change is live until verified.

Release status: NOT READY FOR RELEASE pending deployment verification.
