# Reviews

Standalone extended module for LSevin Providers Portal.

## Rules

- This module depends only on `Core`.
- The module owns its own folder, manifest, migrations, routes, repositories, contracts, i18n, templates/assets where needed.
- It must not import from sibling modules.
- Cross-module communication must use Core contracts, EntityReference, events, or ModuleBus capabilities.

## Main capabilities

- `reviews.read`
- `reviews.reply`
- `reviews.moderate`
- `reviews.vote`
- `reviews.attach_image`

## Main entities

- `Review`
- `ReviewReply`
- `ReviewImage`
- `ReviewVote`
- `ModerationLog`

## Zip/unzip

Zip this folder only:

```text
src/modules/reviews-standalone
```

Extract it back to the same path and register `module.tsx` in `src/core/modules/registry.ts`.
