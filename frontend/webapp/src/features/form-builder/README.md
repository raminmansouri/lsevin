# Form builder usage

The form builder supports form-level runtime usage options. Admin can configure these in **Runtime usage options** on the form designer:

- **Flexible / caller decides**: the component props decide persistence, submit label, endpoint, and submit button visibility.
- **Standalone form**: designed for public/admin intake forms that gather submissions.
- **Booking embedded**: designed for booking steps and draft/booking context.
- **React Hook Form fields-only**: designed to render fields inside an existing `react-hook-form` shell, with no managed submit button by default.

These options are stored in `form_versions.settings`:

```json
{
  "layoutMode": "standard",
  "runtimeUsageMode": "standalone",
  "submissionBehavior": "save_to_database",
  "defaultSubmissionScope": "generic",
  "submitEndpoint": "/api/form-builder/submissions",
  "submitLabel": "Submit form",
  "hideSubmitButton": false
}
```

## 1) Standalone form that stores submissions

When the admin sets **Usage profile = Standalone form** and **Submission behavior = Save to database**, the embed can be very small:

```tsx
import { DynamicFormEmbed } from "@/features/form-builder/components/DynamicFormEmbed";

export default function IntakePage() {
  return <DynamicFormEmbed formKey="patient-intake" locale="fa-IR" />;
}
```

The component loads the published form from:

```txt
GET /api/form-builder/runtime?formKey=patient-intake
```

and submits values to the endpoint configured in form settings, normally:

```txt
POST /api/form-builder/submissions
```

You can still override settings per usage:

```tsx
<DynamicFormEmbed
  formKey="patient-intake"
  locale="fa-IR"
  submitLabel="Send request"
  persistSubmission
  submitContext={{ submissionScope: "generic" }}
/>
```

## 2) Embedded inside booking flow

Set **Usage profile = Booking embedded** and **Default submission scope = Booking** in form options.

```tsx
import { DynamicFormEmbed } from "@/features/form-builder/components/DynamicFormEmbed";

export function BookingCustomFormStep({ serviceDefinitionId, draftId }: { serviceDefinitionId: string; draftId: string }) {
  return (
    <DynamicFormEmbed
      serviceDefinitionId={serviceDefinitionId}
      usageScope="main_booking"
      locale="en-US"
      submitContext={{ bookingDraftId: draftId }}
      onSaved={(result) => {
        // Store result.submissionId on your booking draft/step state if needed.
      }}
    />
  );
}
```

The component loads the mapped active service form from:

```txt
GET /api/form-builder/runtime?serviceDefinitionId=<uuid>&usageScope=main_booking
```

## 3) Use only the fields inside an existing react-hook-form

Set **Usage profile = React Hook Form fields-only** in form options when the form is usually rendered inside a larger form shell.

```tsx
import { useForm } from "react-hook-form";
import { DynamicFormFields } from "@/features/form-builder/components/DynamicServiceForm";

export function MyOwnFormShell({ runtimeForm }) {
  const methods = useForm();

  return (
    <form onSubmit={methods.handleSubmit(console.log)}>
      <DynamicFormFields
        sections={runtimeForm.sections}
        control={methods.control}
        locales={runtimeForm.locales}
      />
      <button type="submit">Save</button>
    </form>
  );
}
```

You can also use `DynamicServiceForm` with your own `methods` object:

```tsx
<DynamicServiceForm
  form={runtimeForm}
  methods={methods}
  hideSubmitButton
  persistSubmission={false}
/>
```

## Admin designer JSON panel

The JSON panel is optional now. Use **Show JSON / Hide JSON** in the form settings header. Hiding it gives more width to the center workbench and real-time preview.

## Admin submission pages

- `/[locale]/admin/form-builder/submissions` lists all submissions.
- `/[locale]/admin/form-builder/[formId]/submissions` lists submissions for one form.
- `/[locale]/admin/form-builder/submissions/[submissionId]` displays a submitted payload and context.

Admin preview submissions are stored with `submission_scope = 'admin_preview'`.

## next-intl translations

This package now uses `next-intl` for admin UI, runtime UI, lazy selector messages, Persian date picker labels, and default validation messages.

Merge the exported messages into your app-level `next-intl` messages:

```ts
import { formBuilderMessages } from "@/features/form-builder/i18n/messages";

export async function getMessages(locale: string) {
  const appMessages = (await import(`../../messages/${locale}.json`)).default;
  const formBuilder =
    formBuilderMessages[locale as keyof typeof formBuilderMessages] ??
    formBuilderMessages["en-US"];

  return {
    ...appMessages,
    ...formBuilder,
  };
}
```

The namespace is `FormBuilder`. Persian translations are included under `fa-IR`. Runtime validation defaults are translated automatically; if an admin writes a custom validation message on a field, that custom message is used as-is.

## File upload field

The designer now includes a **File upload** field type. By default it posts a browser `FormData` request to your existing media storage route:

```txt
POST /api/admin/media/storage
```

That route is expected to return a JSON payload containing at least `fileUrl`. The runtime field stores the returned URL and metadata in the form submission payload. In field settings, admin can configure:

- upload endpoint
- accepted file types, for example `image/*,.pdf,.doc,.docx`
- single vs multiple uploads
- maximum files

## Readable submitted values

Submission admin pages still keep the raw JSON payload, but they also render a label/value view using the saved field labels from the form version. This makes submitted forms readable even when payload keys are generated names like `field_hhuemw`.

Validation summaries also use field labels instead of internal field keys.
