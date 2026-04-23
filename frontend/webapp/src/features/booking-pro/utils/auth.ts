import { getSession } from '@/lib/auth/session';
import { cookies, headers } from 'next/headers';

export async function resolveCurrentUserId(): Promise<string | null> {
  const session=await getSession();
  return session?.user?.id || null;
  // const h = await headers();
  // const c = await cookies();

  // return (
  //   h.get('x-user-id') ||
  //   c.get('user_id')?.value ||
  //   c.get('userId')?.value ||
  //   null
  // );
}
