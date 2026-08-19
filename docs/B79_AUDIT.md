# B79 Audit — Generated State and Next Cache Invalidation

## Trigger

The B78 sourcecheck reached TypeScript and reported five errors:

- `.next/types/validator.ts` referenced deleted `/api/health` and `/api/ready` route modules.
- Three provider-finance actions passed `revalidatePath` directly to `Array.forEach`.

## Audit conclusion

These are two root-cause classes, not five independent defects.

### A. Generated-state lineage leak

The repository is bind-mounted from Windows into the local Linux Node container. B77 intentionally removed the scattered health/ready App Router routes, but the host's previous `.next/types` output survived and remained included by `tsconfig.json`. TypeScript therefore audited stale generated route declarations.

B79 isolates `/app/.next` in a Docker-managed Linux volume shared by sourcecheck and web. `reset-generated-state.mjs` clears that volume plus TypeScript incremental state before every sourcecheck.

This also prevents host/container Next cache interference, including the earlier webpack pack-file rename instability.

### B. Next invalidation callback signature

The source contained exactly three direct forms:

```ts
providerFinancePaths(providerId).forEach(revalidatePath)
```

`forEach` passes an index as the second callback argument. That is incompatible with the second argument accepted by `revalidatePath`. All three are replaced by:

```ts
providerFinancePaths(providerId).forEach((path) => revalidatePath(path))
```

The full source scan found no other direct `revalidatePath`, `revalidateTag`, or `updateTag` array callbacks after repair.

## Preventive gates

B79 adds/requires:

1. `reset-generated-state.mjs` before all source gates.
2. Docker volume isolation for `/app/.next`.
3. A source-integrity rule rejecting direct Next invalidation functions passed to array iteration methods.
4. A deployment-contract check requiring the new sourcecheck order and generated-state volume.
5. Production validation that `.dockerignore` excludes host `.next` output.

## Validation boundary

B79 was applied to a fresh extraction of the user's uploaded current-source audit snapshot. Static/repository-level gates passed. Dependency-backed TypeScript, ESLint, Next build, and live database migration remain intentionally executed in the user's Docker environment where the real dependencies/runtime are available.
