# Staff field ownership

## Staff-editable after approved active ownership
- `category.staff.name_translations`, `title_translations`, `biography_translations`, `specialty_translations`
- personal profile image and `staff_gallery_items`, only from media uploaded by the same signed-in LSevin user
- `staff_languages`
- unverified `staff_education`, `staff_certifications`, `staff_credentials`, and `staff_achievements`

## Provider-controlled relationship fields
- `category.provider_staffs.is_active` and `notes_translations`
- staff-to-provider service assignments and provider operational assignment decisions
- provider-side schedule policies that constrain (but do not impersonate) staff self-availability

## LSevin admin-controlled
- global `category.staff.is_active`
- `is_verified` on certifications and credentials
- staff claim approval/revocation and governance overrides

Verified evidence cannot be deleted by staff. Provider relationship actions do not rewrite staff-owned professional content or global activation.
