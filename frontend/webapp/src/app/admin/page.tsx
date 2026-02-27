import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const AdminApp = dynamic(() => import('admin/AdminApp'), { ssr: false });

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Loading admin micro‑frontend…</div>}>
      <AdminApp />
    </Suspense>
  );
}
