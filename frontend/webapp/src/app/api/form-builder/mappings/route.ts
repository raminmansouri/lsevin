
import { NextRequest, NextResponse } from 'next/server';
import {
  createServiceDefinitionFormMapping,
  deleteServiceDefinitionFormMapping,
  listServiceDefinitionFormMappings,
} from '@/features/form-builder/server/admin-repository';
import { requireApiAdmin } from '@/lib/auth/api-guard';

const USAGE_SCOPES = new Set(['main_booking', 'child_addon_booking']);

export async function GET(request: NextRequest) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const formId = request.nextUrl.searchParams.get('formId');
  if (!formId) {
    return NextResponse.json({ message: 'formId is required' }, { status: 400 });
  }

  try {
    const items = await listServiceDefinitionFormMappings(
      formId,
      request.nextUrl.searchParams.get('locale') || 'fa-IR',
    );
    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/form-builder/mappings failed', error);
    return NextResponse.json({ message: 'Failed to load service form mappings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const usageScope = body.usageScope ?? 'main_booking';

    if (!body.serviceDefinitionId || !body.formId) {
      return NextResponse.json(
        { message: 'serviceDefinitionId and formId are required' },
        { status: 400 },
      );
    }
    if (!USAGE_SCOPES.has(usageScope)) {
      return NextResponse.json({ message: 'Unknown usage scope' }, { status: 400 });
    }

    const result = await createServiceDefinitionFormMapping({
      serviceDefinitionId: body.serviceDefinitionId,
      formId: body.formId,
      usageScope,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/form-builder/mappings failed', error);
    return NextResponse.json({ message: 'Failed to create service form mapping' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ message: 'id is required' }, { status: 400 });
  }

  try {
    const removed = await deleteServiceDefinitionFormMapping(id);
    if (!removed) {
      return NextResponse.json({ message: 'Mapping not found' }, { status: 404 });
    }
    return NextResponse.json({ id: removed.id });
  } catch (error) {
    console.error('DELETE /api/form-builder/mappings failed', error);
    return NextResponse.json({ message: 'Failed to delete service form mapping' }, { status: 500 });
  }
}
