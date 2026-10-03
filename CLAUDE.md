# Production-Ready Feature Development & Release Verification

A feature, bug fix, refactor, or technical change is **NOT complete merely because it compiles, builds, or passes existing tests**.

The objective is to deliver software that works through the complete real user workflow in a production-like environment and can be safely released without introducing regressions.

You must treat implementation, verification, migration safety, integration testing, regression testing, and release validation as part of the same task.

---

## 1. Definition of Done

Never declare a task:

- done
- fixed
- complete
- production ready
- ready for release

unless all relevant verification gates below have actually been executed successfully.

Passing:

- TypeScript/type checking
- compilation
- unit tests
- build

alone is never sufficient evidence that a feature is production-ready.

---

## 2. Before Coding — Requirement & Impact Analysis

Before modifying code:

- [ ] Read and understand all acceptance criteria.
- [ ] Identify the complete user workflow affected by the change.
- [ ] Identify existing behavior that may regress.
- [ ] Identify all affected frontend components.
- [ ] Identify all affected routes/pages.
- [ ] Identify APIs/server actions/backend handlers.
- [ ] Identify domain/business logic.
- [ ] Identify database tables and relationships.
- [ ] Identify indexes and constraints.
- [ ] Identify migrations.
- [ ] Identify authentication dependencies.
- [ ] Identify authorization/permission dependencies.
- [ ] Identify caches.
- [ ] Identify queues/background jobs.
- [ ] Identify external integrations.
- [ ] Identify environment/configuration dependencies.
- [ ] Identify deployment implications.
- [ ] Identify existing tests that need updating.
- [ ] Identify new tests required.

Do not modify only the most obvious file without tracing the feature through its dependent layers.

For every meaningful change, build an internal dependency chain such as:

Frontend → API/server action → business logic → database → integrations → deployment/runtime.

---

## 3. Database & Migration Safety

Database changes are release-critical.

### Migration rules

- [ ] Never edit an already-applied or released migration.
- [ ] Existing migrations must be treated as immutable.
- [ ] Every new schema change must receive a new migration.
- [ ] Preserve migration ordering.
- [ ] Preserve migration/checksum integrity.
- [ ] Verify foreign keys.
- [ ] Verify unique constraints.
- [ ] Verify nullability.
- [ ] Verify defaults.
- [ ] Verify indexes.
- [ ] Verify data compatibility.
- [ ] Verify application queries against the resulting schema.

### Production-state migration testing

Never validate a migration only against a fresh empty database.

Before release:

1. Start from a database representing the previous/current production migration state.
2. Apply only the new migrations.
3. Verify migration success.
4. Verify expected tables/columns/indexes/constraints.
5. Start the new application version against the upgraded database.
6. Run integration tests.
7. Run relevant E2E tests.
8. Confirm existing data remains usable.

If the current production migration state cannot be inspected or reproduced, explicitly report this as an unverified release risk.

Never assume the local development database matches production.

---

## 4. Backend Verification

For every changed backend workflow, test all relevant scenarios.

### Success

- [ ] Normal successful request.
- [ ] Expected database persistence.
- [ ] Correct response.
- [ ] Correct side effects.

### Validation

- [ ] Missing input.
- [ ] Invalid input.
- [ ] Boundary values.
- [ ] Duplicate/conflicting input where relevant.

### Security

- [ ] Unauthenticated request.
- [ ] Unauthorized user.
- [ ] Incorrect role.
- [ ] Cross-workspace/tenant access where relevant.

### Failure behavior

- [ ] Missing entity.
- [ ] Database failure.
- [ ] External-service failure.
- [ ] Unexpected exception.

Unexpected infrastructure/server errors must **never** be incorrectly converted into user validation errors.

For example, a database failure must not appear as:

> Invalid email or role.

Use appropriate structured error categories such as:

- ValidationError
- AuthenticationError
- AuthorizationError
- NotFoundError
- ConflictError
- InfrastructureError
- UnexpectedError

Unexpected failures must be logged with sufficient operational context, while never logging passwords, tokens, secrets, or sensitive data.

---

## 5. Frontend Verification

Do not test only rendering or compilation.

Test the actual user interaction.

Where relevant verify:

- [ ] Page loads.
- [ ] Direct URL navigation.
- [ ] Refresh.
- [ ] Browser back/forward navigation.
- [ ] Mouse interaction.
- [ ] Keyboard interaction.
- [ ] Enter/Escape behavior.
- [ ] Search/select components.
- [ ] Form submission.
- [ ] Empty states.
- [ ] Loading states.
- [ ] Error states.
- [ ] Disabled states.
- [ ] Server validation errors.
- [ ] Permission-based UI.
- [ ] Persistence after reload.
- [ ] Responsive behavior.
- [ ] Existing related workflows.

For custom controls such as:

- comboboxes
- search selects
- rich text editors
- drag/drop
- dialogs
- dropdowns
- keyboard shortcuts

test realistic user interactions, not only component state.

---

## 6. Integration Testing

Critical workflows must be validated across real application boundaries.

Prefer:

Frontend → Backend/API → Real test database

For release-validation tests, do not mock critical dependencies when using the real dependency is practical.

Verify where relevant:

- [ ] Frontend → API/server action.
- [ ] API → business logic.
- [ ] Business logic → database.
- [ ] Authentication.
- [ ] Authorization.
- [ ] Workspace/tenant isolation.
- [ ] Cache behavior.
- [ ] External integrations.
- [ ] Persistence and retrieval.

---

## 7. End-to-End Testing

For every new or materially changed user workflow, create or update Playwright E2E tests.

At minimum, where applicable, cover:

- [ ] Direct page navigation.
- [ ] Primary successful workflow.
- [ ] Invalid input.
- [ ] Refresh.
- [ ] Persistence after refresh.
- [ ] Relevant user roles.
- [ ] Permission failure.
- [ ] API/server failure.
- [ ] Cross-page workflow.
- [ ] Critical keyboard/mouse behavior.

E2E tests must exercise behavior as a real user would.

Example:

Login
→ open Settings
→ open Team
→ enter email
→ search/select role
→ submit invitation
→ verify invitation exists
→ refresh page
→ verify invitation remains visible.

For a project workflow:

Login
→ `/work/projects`
→ verify page loads
→ create project
→ open project
→ edit project
→ refresh
→ verify persisted data.

---

## 8. Regression Testing

Every confirmed bug should receive a regression test when technically reasonable.

A bug is not considered fully fixed until:

- [ ] Root cause is identified.
- [ ] The root cause is corrected.
- [ ] A regression test reproducing or representing the previous failure is added.
- [ ] The test passes after the fix.
- [ ] Related code is checked for the same failure pattern.

Do not only patch the visible symptom.

Search for other occurrences of the same bug pattern throughout the codebase.

---

## 9. Environment Verification

Before declaring a feature release-ready, determine whether the tested environment meaningfully represents the target environment.

Verify relevant:

- [ ] Application commit/version.
- [ ] Container image/version.
- [ ] Database version.
- [ ] Database migration level.
- [ ] Redis/cache.
- [ ] Required environment variables.
- [ ] Authentication configuration.
- [ ] Storage configuration.
- [ ] Queue/background services.
- [ ] Reverse proxy/network dependencies.
- [ ] External-service configuration.

Do not assume development, CI, staging, and production are equivalent.

---

## 10. Security & Data Integrity

For every change involving sensitive or persistent data, verify:

- [ ] Authentication.
- [ ] Authorization.
- [ ] Tenant/workspace isolation.
- [ ] Server-side validation.
- [ ] Input sanitization where relevant.
- [ ] No secret exposure.
- [ ] No sensitive logging.
- [ ] No unauthorized mass assignment.
- [ ] No unintended destructive database operation.
- [ ] Transactions are used where partial writes would be dangerous.
- [ ] Concurrent operations are handled where relevant.

---

## 11. Build & Static Verification

Before release, run all applicable:

- [ ] formatter/check-format
- [ ] lint
- [ ] typecheck
- [ ] compiler
- [ ] unit tests
- [ ] integration tests
- [ ] production build
- [ ] migration integrity/checksum verification
- [ ] migration upgrade test
- [ ] E2E tests
- [ ] smoke tests
- [ ] security/static analysis where available

A successful build is only one release gate.

---

## 12. Staging Verification

When staging exists, deploy the exact release candidate to staging.

Then:

- [ ] Run migrations using the real deployment mechanism.
- [ ] Verify application startup.
- [ ] Verify health checks.
- [ ] Run smoke tests.
- [ ] Run relevant Playwright/E2E tests.
- [ ] Verify important logs contain no unexpected exceptions.
- [ ] Verify affected user workflows manually or automatically.

Do not consider local-only validation equivalent to staging verification.

---

## 13. Production Deployment Verification

When production deployment is part of the task:

After deployment verify:

- [ ] Expected application version is running.
- [ ] Database migrations completed.
- [ ] Application health checks pass.
- [ ] Critical pages return successfully.
- [ ] Critical APIs respond successfully.
- [ ] Changed feature works.
- [ ] Relevant logs show no unexpected failures.
- [ ] Existing critical workflows remain functional.

A deployment command succeeding does not by itself mean the release succeeded.

---

## 14. Smoke Tests

Maintain automated smoke tests for critical CRM workflows.

At minimum verify important routes/workflows such as:

- authentication
- dashboard
- CRM customers
- leads/deals
- projects
- tasks
- team/member management
- permissions
- search
- comments
- rich text
- file uploads
- notifications

Smoke tests should detect catastrophic failures such as:

- HTTP 500
- missing database table
- invalid migration state
- missing environment variable
- authentication failure
- broken critical route

---

## 15. AI-Agent Development Rule

Do not validate your own implementation only from the perspective of how it was written.

After implementation, switch to an adversarial QA mindset.

Attempt to break the feature.

Check:

- unexpected inputs
- stale state
- refresh
- duplicate actions
- permission changes
- partial failures
- missing data
- production-like data
- previous migration state
- direct navigation
- different roles
- keyboard behavior
- race/concurrency problems where relevant

The goal of QA is not to prove the implementation works.

The goal is to discover evidence that it does not.

---

## 16. Handling Unverifiable Work

If a required check cannot be executed because of missing:

- database access
- staging access
- production access
- credentials
- external-service access
- infrastructure access

do not assume success.

Explicitly report the missing verification.

Example:

`Production migration state could not be verified because production database access was unavailable.`

Then mark the appropriate release status as:

**NOT READY FOR RELEASE**

unless the unverified item is genuinely irrelevant to the change.

---

## 17. Final Report Format

Every completed implementation task must finish with the following report.

### IMPLEMENTED

List exactly what changed.

### ROOT CAUSE

For bugs, explain the actual underlying cause rather than only the visible symptom.

### VERIFIED

List only checks that were actually executed.

Include results where useful.

Example:

- Typecheck: PASS
- Unit tests: 152/152 PASS
- Integration tests: 31/31 PASS
- Production build: PASS
- Migration upgrade test: PASS
- Playwright: 24/24 PASS

### NOT VERIFIED

List anything that was not actually tested.

Do not omit important unverified areas.

### DATABASE / MIGRATIONS

State:

- whether schema changed
- migrations added
- migrations executed
- previous-production-state upgrade verified or not
- remaining migration/deployment requirements

### REGRESSION TESTS

List tests added for the bug/change.

### DEPLOYMENT REQUIRED

List:

- migrations
- environment variables
- secrets/configuration
- infrastructure changes
- restart/redeployment
- external-service changes
- manual operational steps

### RISKS

List remaining assumptions, risks, and edge cases.

### RELEASE STATUS

Output exactly one:

**READY FOR RELEASE**

or

**NOT READY FOR RELEASE**

Do not output READY FOR RELEASE if any release-critical verification remains incomplete.

---

# Core Principle

The objective is not:

> Make the code compile.

The objective is:

> Deliver a feature that works through the complete real-world workflow, survives deployment from the current production state, does not break existing functionality, is covered by appropriate automated tests, and has concrete evidence supporting its release readiness.

When uncertain, investigate and verify rather than assume.

## Browser and E2E Verification

For frontend or full-stack user-facing changes:

- Use Playwright MCP when available to inspect and exercise the real application.
- Do not use source-code inspection alone as proof that browser behavior works.
- Create or update persistent `@playwright/test` tests for critical workflows.
- Every confirmed UI regression should receive a regression test when practical.
- Run applicable Playwright tests before declaring the task ready.
- Run smoke tests after deployment where deployment access exists.
- If browser/runtime verification cannot be performed, report it under NOT VERIFIED.