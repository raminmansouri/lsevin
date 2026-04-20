/* ----------------------------------------------------
 * A minimal Next.js API route that delegates to
 * the server function above.  
 * This route can be cached via the same helpers.
 * ---------------------------------------------------- */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServicePageById, getServicePageByIdTag } from '@/features/service-providers/api/server/get-service-page';
import { getSession } from '@/lib/auth/session';
import { localeToHeader } from '@/config/locales';
import { LocaleTypes } from '@/types/common';


export const GET = async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const serviceId = searchParams.get('serviceId');
  const locale = searchParams.get('locale') ?? 'en';

  if (!serviceId) return NextResponse.json({ error: 'Missing serviceId' }, { status: 400 });

  const tag = getServicePageByIdTag(serviceId);

  const localeHeader = localeToHeader(locale as LocaleTypes);


   const session = await getSession();
    const token = session?.user?.accessToken;
  
    const { data, error } = await await getServicePageById(
    { locale: localeHeader, token }, // Token is optional
      { serviceId });;
  
    if (error) {
      return NextResponse.json(error, { status: error.status });
    }
  
    return NextResponse.json(data);
  }
