
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminFormBuilderPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/form-builder/forms', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Form builder</h1>
          <p className="mt-1 text-sm text-slate-500">Manage standalone service and add-on forms in the form_builder schema.</p>
        </div>
        <Link href="./form-builder/new" className="rounded-2xl bg-[#083f30] px-5 py-3 text-sm font-semibold text-white">New form</Link>
      </div>

      <div className="grid gap-4">
        {items?.map((item: any) => (
          <Link key={item.id} href={`./form-builder/${item.id}`} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-bold text-slate-900">{item.name}</div>
                <div className="mt-1 text-sm text-slate-500">{item.key}</div>
                {item.description ? <p className="mt-3 text-sm text-slate-600">{item.description}</p> : null}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right text-xs text-slate-600">
                <div>Scope: {item.form_scope}</div>
                <div>Status: {item.latest_version?.status ?? 'draft'}</div>
                <div>Version: {item.latest_version?.versionNumber ?? 0}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
