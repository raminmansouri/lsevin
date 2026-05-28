-- Keeps active booking drafts lightweight by removing transient client payloads
-- that must live in form_builder.submissions or media storage, not in booking.booking_drafts.metadata.

update booking.booking_drafts
set metadata = coalesce(metadata, '{}'::jsonb)
  - 'formValues'
  - 'payload'
  - 'normalizedPayload'
  - 'files'
  - 'uploadFiles'
  - 'documents'
  - 'documentPayload'
  - 'base64'
  - 'dataUrl'
  - 'fileData'
  - 'imageData'
  - 'rawFile'
where status in ('Draft', 'InProgress')
  and coalesce(metadata, '{}'::jsonb) ?| array[
    'formValues',
    'payload',
    'normalizedPayload',
    'files',
    'uploadFiles',
    'documents',
    'documentPayload',
    'base64',
    'dataUrl',
    'fileData',
    'imageData',
    'rawFile'
  ];

-- Draft document rows should reference uploaded media ids/URLs only. Inline data URLs
-- make drafts huge and are blocked by the application after this patch.
delete from booking.booking_draft_documents
where draft_id in (
  select id
  from booking.booking_drafts
  where status in ('Draft', 'InProgress')
)
and (
  left(coalesce(file_url, ''), 5) = 'data:'
  or length(coalesce(file_url, '')) > 2000
  or left(coalesce(file_name, ''), 5) = 'data:'
  or length(coalesce(file_name, '')) > 2000
);
