# Booking and shop mobile changes — 2026-10-17

## IMPLEMENTED

1. Booking selections wrap long names and prices. Details and reset-confirmation dialogs render through a Radix portal above the mobile navigation, use the dynamic viewport height, scroll, trap keyboard focus, close with Escape, and restore focus to their opener.
2. Booking/service/specialist/shop action bars allow large prices to wrap independently of their buttons. Additional bottom spacing keeps content reachable behind taller bars.
3. The provider's “view services” action activates the services tab and scrolls after the section mounts. Repeated clicks work when the tab is already selected.
4. Customer-facing rial/toman prices and currency choices use readable currency names rather than IRR/IRT. This includes booking review, add-ons, payment plans, shop selectors, package checkout, wallet choices, and the price converter. Stored currency identifiers and gateway amounts retain their original meanings; no monetary conversion was introduced by the label changes.
5. Booking review defaults to the online method when it is available. Other payment methods are optional behind “change”; a single available gateway does not require an additional selection. Payment remains disabled while method availability is unknown or no usable method exists.
6. Booking submission proceeds directly to payment or the invoice. The redundant green submission/continue box and duplicate payment-action box are removed. Payment retries use the primary action.
7. Shop checkout offers methods supported by its payment integration and enabled gateway configuration. Quotes and order placement use the selected gateway's configured billing currency. Server method IDs override submitted method IDs. Gateway-start failures remain on checkout for retry with the same idempotency key. A phone-only account must supply the email required by order placement. Quote failures distinguish invalid requests from infrastructure errors and do not expose database details.
8. Authentication redirects preserve the current trusted public domain. An authenticated cart read merges the guest cart even when a customer cart already exists. Transaction and row locks prevent concurrent reads from merging quantities twice; saved-for-later state and JSON snapshots are preserved. Database failures propagate instead of masquerading as an empty cart.

## ROOT CAUSE

- Selection rows truncated useful content. Custom fixed dialogs were inside ancestor stacking/containing contexts and shared the bottom navigation's stacking level.
- Inflexible price/button rows and insufficient bottom spacing did not accommodate large amounts.
- “View services” only changed tab state; it did not scroll to the newly mounted section.
- Several screens interpolated raw currency codes instead of using the shared money formatter.
- Checkout presented every method and nested gateway as a choice, then repeated continuation controls after submission.
- Shop UI allowed authenticated customers to omit an email that the order repository requires. Payment choices did not consistently account for enabled gateways and their billing currencies, and payment-start failures navigated away from checkout.
- The live `lsevincare.com` checkout redirected guests to `appmain.lsevin.com` for login. Guest-cart cookies cannot cross these unrelated domains. Separately, the cart resolver returned an existing customer cart before merging guest items.
- The local database has schema drift: its migration registry lists historical migrations whose columns/tables are absent. This was observed locally and must not be assumed to describe production.

The precise cause of every production purchase failure is **not** established: an authenticated production checkout and the external payment provider were not exercised.

## VERIFIED

- Focused Vitest suite: **38/38 PASS**, including **4 real PostgreSQL cart tests**. Coverage includes concurrent merging, idempotency, ownership protection, saved items, database errors, configured payment currencies, unavailable methods, server method selection, safe errors, trusted domain redirects, and currency formatting.
- Playwright component-browser regression suite: **7/7 PASS** in Chrome at a mobile viewport. It exercises the actual UI components and scroll hook. Coverage includes repeated services scrolling, dialog layering/scroll/Escape/focus, reset confirmation, optional payment alternatives, service failures, large totals, retry idempotency, and required email for phone-only accounts.
- The large-total browser regression was rerun after the final bottom-spacing adjustment.
- Playwright MCP inspected the live shop and product page on `lsevincare.com` and reproduced the cross-domain login redirect.
- `lsevin.ir` returned a browser gateway timeout; a separate `curl --noproxy '*'` request timed out after 12 seconds.
- Full TypeScript checking was executed and reports errors outside the focused changes; it is not a passing release gate.
- A final repeat of full type checking did not complete and was stopped; the final candidate has syntax and focused test evidence, not a passing full typecheck.
- Syntax-only transpilation of 15 changed core files: **PASS**, with zero syntax errors. This is not a substitute for type checking.
- Test cleanup was checked: no test products remained in either the original local database or the verification copy.

Browser fixtures replace backend calls, navigation, image loading, and rich-text rendering. These browser results are not evidence of an end-to-end payment or login against the deployed application. Database cart tests use real PostgreSQL and mock only request/pricing context.

## NOT VERIFIED

- Full application booking → payment → gateway return → persisted invoice workflow.
- Real login/signup → cart preservation through each public domain.
- Authenticated shop order placement and successful external payment.
- Staging, production logs, deployed application version, and production migration state.
- Production build: attempted, then stopped because of resource consumption without completion. No build success is claimed.
- Full application browser verification: local startup encountered an instrumentation dependency error (`agent-base`/`web-push`, unresolved `http` in the instrumentation import path).
- ESLint was attempted and failed to load the configured `@next/eslint-plugin-next` dependency. No lint success is claimed.
- Repository-wide formatting has not been established as passing. Formatting was run on the focused files; this is not a whole-repository formatter result.

## DATABASE / MIGRATIONS

- No schema change or new migration was introduced by this task.
- Verification used PostgreSQL 17.10 and a separate local database named `lsevin_booking_shop_20261017`, copied from local `lsevin`.
- Existing idempotent SQL from `0018_finance_currencies_soft_delete.sql` and `0018_shop_v01.sql` was executed **only in that verification copy** to restore missing historical schema. Historical migration files were not edited. The original development database was not migrated.
- The normal migration runner was attempted against the copy. It identified 13 pending migrations and failed on `0061_patient_requirement_freshness.sql` because the recorded baseline lacks the `patient` schema.
- Previous-production-state upgrade verification is **not established**. Do not deploy by assuming the migration registry accurately represents the schema.

## REGRESSION TESTS

- `e2e/commerce-mobile.spec.ts`
- `playwright.commerce-ui.config.ts` and `e2e/fixtures/commerce-ui/`
- `src/features/shop/api/cart-merge.int.test.ts`
- `src/features/shop/api/cart-errors.test.ts`
- `src/features/shop/api/checkout-payment-methods.test.ts`
- `src/features/shop/actions/checkout-actions.test.ts`
- `src/lib/http/public-origin.test.ts`
- Existing finance/shop money and payment-split tests were also run.

Run the browser suite with:

```sh
node ../../node_modules/@playwright/test/cli.js test --config playwright.commerce-ui.config.ts
```

Run database tests only with `ACCOUNTING_TEST_DATABASE_URL` pointing to a disposable local database with the expected schema. The test setup rejects remote databases.

## DEPLOYMENT REQUIRED

- These changes have not been deployed or committed.
- Review and finish the existing Git merge. The workspace was already mid-merge, with conflicts in booking, pricing, payment, and configuration files. Conflicting text was reconciled to permit investigation; the merge index remains unresolved and has not been staged or committed.
- Original conflicted files were backed up outside the repository under `../.codex-booking-shop-20261017/merge-backup/`.
- Resolve the application typecheck/runtime/build gates and reconcile the actual deployment database before releasing the combined worktree.
- Verify enabled shop/booking payment methods, gateway credentials, configured billing currencies, exchange rates, delivery options, and callback domains in staging.
- Redeploy the reviewed candidate, then execute authenticated browser and sandbox payment workflows on all three public domains and run post-deployment smoke checks.
- No new environment variable, secret, or infrastructure service is required by these changes.

## RISKS

- The surrounding worktree contains substantial pre-existing staged/unstaged changes and an unfinished merge. Financial merge resolutions need review with the rest of that work.
- Production schema/configuration cannot be inferred from the local snapshot.
- External gateway settlement, refunds, callback-origin/session behavior, and payment installments have not received production-like integration verification here.
- `lsevin.ir` could not be reached directly from this environment.
- Verification logs are under `../.codex-booking-shop-20261017/` relative to the repository root.

## RELEASE STATUS

**NOT READY FOR RELEASE**
