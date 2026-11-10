import { createHash } from 'node:crypto';

/** Git may check out SQL with CRLF on Windows; migration identity is the SQL text. */
export function migrationChecksum(sqlText) {
  return createHash('sha256').update(sqlText.replace(/\r\n/g, '\n')).digest('hex');
}
