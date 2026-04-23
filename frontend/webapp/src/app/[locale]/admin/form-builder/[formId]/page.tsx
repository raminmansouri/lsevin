
'use client';

import { useEffect, useState } from 'react';
import { FormBuilderDesigner } from '@/features/form-builder/components/FormBuilderDesigner';

async function getForm(formId: string) {
  const res = await fetch(`/api/form-builder/forms?formId=${formId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load form');
  return res.json();
}

export default function AdminFormBuilderDetailPage({ params }: { params: Promise<{ formId: string }> }) {
  const [initial, setInitial] = useState<any>(null);
  const [formId, setFormId] = useState<string | null>(null);

  useEffect(() => {
    params.then(async ({ formId }) => {
      setFormId(formId);
      if (formId === 'new') return;
      const { item } = await getForm(formId);
      setInitial(item);
    });
  }, [params]);

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{formId === 'new' ? 'Create form' : 'Edit form'}</h1>
        <p className="mt-1 text-sm text-slate-500">Design booking forms with extensible field types, media pickers, and multilingual fields.</p>
      </div>

      <FormBuilderDesigner
        initial={initial ?? undefined}
        onSave={async (value) => {
          await fetch('/api/form-builder/forms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...value, formId: formId === 'new' ? undefined : formId }),
          });
          alert('Form saved');
        }}
      />
    </div>
  );
}
