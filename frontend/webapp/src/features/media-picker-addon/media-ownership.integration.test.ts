import { describe, expect, it } from 'vitest';
import sql from '@/config/database/db';
import { listMedia } from '@/components/media/server/repository';

const ownerA = '11111111-1111-1111-1111-111111111111';
const ownerB = '22222222-2222-2222-2222-222222222222';

describe('media ownership on a real database', () => {
  it('shows each customer only their files while the admin view sees both', async () => {
    const rollback = new Error('rollback media fixture');
    try {
      await sql.begin(async (tx) => {
        for (const [owner, suffix] of [[ownerA, 'a'], [ownerB, 'b']] as const) {
          await tx`
            insert into media.media_library (original_name, stored_name, file_url, mime_type, media_type,
              file_size, created_by, is_public)
            values (${`ownership-${suffix}.pdf`}, ${`ownership-${suffix}.pdf`},
              ${`CustomerDocument/${owner}/ownership-${suffix}.pdf`}, 'application/pdf', 'file', 100,
              ${owner}, false)
          `;
        }
        const owned = await listMedia({ search: 'ownership-', pageSize: 10 }, tx as typeof sql, ownerA);
        const all = await listMedia({ search: 'ownership-', pageSize: 10 }, tx as typeof sql);
        expect(owned.items).toHaveLength(1);
        expect(owned.items[0].createdBy).toBe(ownerA);
        expect(owned.items[0].fileUrl).toMatch(/^\/api\/media\/private\//);
        expect(all.items).toHaveLength(2);
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });
});
