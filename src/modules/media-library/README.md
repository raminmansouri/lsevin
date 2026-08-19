# Media Library

Standalone extended module for LSevin Providers Portal.

## Rules

- This module depends only on `Core`.
- The module owns its own folder, manifest, migrations, routes, repositories, contracts, i18n, templates/assets where needed.
- It must not import from sibling modules.
- Cross-module communication must use Core contracts, EntityReference, events, or ModuleBus capabilities.

## Main capabilities

- `media.upload`
- `media.attach_to_entity`
- `media.detach_from_entity`
- `media.reorder`
- `media.localize_alt_text`

## Main entities

- `MediaAsset`
- `MediaUsage`
- `MediaVariant`
- `StorageAdapter`

## Zip/unzip

Zip this folder only:

```text
src/modules/media-library
```

Extract it back to the same path and register `module.tsx` in `src/core/modules/registry.ts`.
