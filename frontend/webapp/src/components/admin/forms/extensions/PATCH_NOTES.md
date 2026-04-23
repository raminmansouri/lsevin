This extension layer adds three capabilities without rewriting the working core:

1. Cascading lazy selects via extension config only.
2. Virtual/transient parent fields (for forms like marketing.offers where provider_service_id exists but provider_id does not).
3. Form field augmentation support: before / replace / after.

What is included:
- Generic configured relation field bound to a config key.
- Generic cascading chain field that can render provider -> service or category -> provider -> service.
- Backward-compatible relation-cascade API with raw parent columns for edit hydration.
- Additive dynamic-form integration that understands extension augmentations.

Current example:
- marketing.offers.provider_service_id renders as a two-step chain:
  Provider (__provider_id, transient) -> Service (provider_service_id)

How to add a deeper chain:
- Add a transient field config like marketing.offers.__category_id
- Make marketing.offers.__provider_id depend on __category_id
- Update the chain for marketing.offers.provider_service_id to steps:
  __category_id -> __provider_id -> provider_service_id

All transient fields are still stripped before submit because the existing DynamicForm already removes keys starting with '__'.
