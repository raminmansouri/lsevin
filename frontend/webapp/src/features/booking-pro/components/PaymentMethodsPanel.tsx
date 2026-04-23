
'use client';

import { useEffect, useState } from 'react';

type PaymentMethod = {
  code: string;
  name: string;
  description?: string | null;
};

export function PaymentMethodsPanel(props: {
  selected?: string;
  onChange: (code: string) => void;
}) {
  const [items, setItems] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    fetch('/api/booking-pro/payments/methods', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => {});
  }, []);

  const list = items.length ? items : [
    { code: 'card', name: 'Card' },
    { code: 'bank', name: 'Bank transfer' },
    { code: 'wallet', name: 'Wallet' },
  ];

  return (
    <div className="space-y-3">
      {list.map((item) => (
        <button
          key={item.code}
          type="button"
          onClick={() => props.onChange(item.code)}
          className={`w-full rounded-2xl border px-4 py-3 text-left ${props.selected === item.code ? 'border-[#083f30] bg-[#083f30]/5' : 'border-slate-200 bg-white'}`}
        >
          <div className="font-semibold text-slate-900">{item.name}</div>
          {item.description ? <div className="mt-1 text-xs text-slate-500">{item.description}</div> : null}
        </button>
      ))}
    </div>
  );
}
