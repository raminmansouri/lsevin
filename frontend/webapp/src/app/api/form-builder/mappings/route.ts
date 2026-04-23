
import { NextRequest, NextResponse } from 'next/server';
import { createServiceDefinitionFormMapping } from '@/features/form-builder/server/admin-repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createServiceDefinitionFormMapping({
      serviceDefinitionId: body.serviceDefinitionId,
      formId: body.formId,
      usageScope: body.usageScope ?? 'main_booking',
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/form-builder/mappings failed', error);
    return NextResponse.json({ message: 'Failed to create service form mapping' }, { status: 500 });
  }
}
