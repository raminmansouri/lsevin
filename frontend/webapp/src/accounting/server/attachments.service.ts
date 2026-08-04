import "server-only";

import db from "@/config/database/db";

import { assertAccounting } from "./access";
import { getPanelUser } from "./panel-auth";

/**
 * Evidence attached to a journal entry — the invoice, the bank advice, the
 * receipt that justifies the numbers.
 *
 * The bytes live in the database (0017). That keeps the evidence inside the same
 * backup and the same transaction as the entry it belongs to, which for
 * accounting records is the point: a restore that brings back the ledger without
 * the paperwork is not a restore.
 */

export type AttachmentKind = "invoice" | "receipt" | "bank_advice" | "contract" | "other";

export const ATTACHMENT_KINDS: AttachmentKind[] = [
  "invoice",
  "receipt",
  "bank_advice",
  "contract",
  "other",
];

/** Mirrors the CHECK in 0017. Rejected here too so the user gets a real message. */
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * What an accountant actually attaches. Deliberately narrow: an attachment is
 * displayed to whoever audits the books later, and an arbitrary upload surface on
 * a finance panel is worth more to an attacker than it is to a bookkeeper.
 */
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

export class AttachmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachmentError";
  }
}

export type AttachmentRow = {
  id: string;
  entryId: string;
  fileName: string;
  contentType: string | null;
  sizeBytes: number | null;
  sha256: string | null;
  kind: string;
  note: string | null;
  uploadedAt: string;
  storedInline: boolean;
};

export async function listAttachments(entryId: string): Promise<AttachmentRow[]> {
  await assertAccounting("read");

  const rows = await db<
    {
      id: string;
      entry_id: string;
      file_name: string;
      content_type: string | null;
      size_bytes: number | null;
      sha256: string | null;
      kind: string;
      note: string | null;
      uploaded_at: string;
      stored_inline: boolean;
    }[]
  >`
    select id::text, entry_id::text, file_name, content_type, size_bytes::int,
           sha256, kind, note, uploaded_at::text, stored_inline
      from accounting.v_entry_attachments
     where entry_id = ${entryId}
     order by uploaded_at
  `;

  return rows.map((r) => ({
    id: r.id,
    entryId: r.entry_id,
    fileName: r.file_name,
    contentType: r.content_type,
    sizeBytes: r.size_bytes,
    sha256: r.sha256,
    kind: r.kind,
    note: r.note,
    uploadedAt: r.uploaded_at,
    storedInline: r.stored_inline,
  }));
}

/**
 * Attachments for many entries at once.
 *
 * The journal lists up to 100 documents; asking per row would be 100 round trips
 * to render one page.
 */
export async function listAttachmentsForEntries(
  entryIds: string[]
): Promise<Map<string, AttachmentRow[]>> {
  await assertAccounting("read");
  if (entryIds.length === 0) return new Map();

  const rows = await db<
    {
      id: string;
      entry_id: string;
      file_name: string;
      content_type: string | null;
      size_bytes: number | null;
      sha256: string | null;
      kind: string;
      note: string | null;
      uploaded_at: string;
      stored_inline: boolean;
    }[]
  >`
    select id::text, entry_id::text, file_name, content_type, size_bytes::int,
           sha256, kind, note, uploaded_at::text, stored_inline
      from accounting.v_entry_attachments
     where entry_id = any(${entryIds}::uuid[])
     order by uploaded_at
  `;

  const byEntry = new Map<string, AttachmentRow[]>();
  for (const r of rows) {
    const row: AttachmentRow = {
      id: r.id,
      entryId: r.entry_id,
      fileName: r.file_name,
      contentType: r.content_type,
      sizeBytes: r.size_bytes,
      sha256: r.sha256,
      kind: r.kind,
      note: r.note,
      uploadedAt: r.uploaded_at,
      storedInline: r.stored_inline,
    };
    const list = byEntry.get(r.entry_id);
    if (list) list.push(row);
    else byEntry.set(r.entry_id, [row]);
  }
  return byEntry;
}

export async function addAttachment(input: {
  entryId: string;
  file: File;
  kind: AttachmentKind;
  note?: string | null;
}): Promise<{ id: string }> {
  await assertAccounting("operate");
  const user = await getPanelUser();
  if (!user) throw new AttachmentError("Not signed in");

  const { file } = input;
  if (!file || file.size === 0) throw new AttachmentError("No file was selected");
  if (file.size > MAX_BYTES) {
    throw new AttachmentError(`The file is larger than ${MAX_BYTES / 1024 / 1024} MB`);
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    throw new AttachmentError("Only PDF and image files can be attached");
  }

  const [entry] = await db<{ id: string }[]>`
    select id::text as id from accounting.journal_entries where id = ${input.entryId}
  `;
  if (!entry) throw new AttachmentError("Document not found");

  const bytes = Buffer.from(await file.arrayBuffer());

  // size_bytes and sha256 are derived by a trigger from these bytes, so nothing
  // the browser claimed about the file is trusted.
  const [row] = await db<{ id: string }[]>`
    insert into accounting.entry_attachments (
      entry_id, file_name, content_type, kind, note, content, uploaded_by
    ) values (
      ${input.entryId},
      ${file.name.slice(0, 255)},
      ${file.type || null},
      ${input.kind},
      ${input.note?.trim() || null},
      ${bytes},
      ${user.id}
    )
    returning id::text as id
  `;

  return { id: row.id };
}

/** Reads one attachment's bytes. The only place the payload is loaded. */
export async function readAttachment(
  id: string
): Promise<{ fileName: string; contentType: string; bytes: Buffer } | null> {
  await assertAccounting("read");

  const [row] = await db<
    { file_name: string; content_type: string | null; content: Buffer | null }[]
  >`
    select file_name, content_type, content
      from accounting.entry_attachments
     where id = ${id}
  `;

  if (!row?.content) return null;

  return {
    fileName: row.file_name,
    contentType: row.content_type ?? "application/octet-stream",
    bytes: row.content,
  };
}

/** Removes an attachment. The database refuses once the entry is in the books. */
export async function deleteAttachment(id: string): Promise<void> {
  await assertAccounting("operate");
  await db`delete from accounting.entry_attachments where id = ${id}`;
}
