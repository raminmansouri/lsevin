'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, MapPin, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { listAddressesAction, saveAddressAction } from '@/features/shop/actions/checkout.actions';

type Address = {
  id: string;
  fullName: string;
  phoneNumber?: string | null;
  country: string;
  city: string;
  stateRegion?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  isDefault: boolean;
};

type NewAddressForm = {
  fullName: string;
  phoneNumber: string;
  country: string;
  city: string;
  stateRegion: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
};

const EMPTY_FORM: NewAddressForm = {
  fullName: '',
  phoneNumber: '',
  country: '',
  city: '',
  stateRegion: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
};

function addressLabel(address: Address): string {
  return [address.addressLine1, address.city, address.country].filter(Boolean).join('، ');
}

/**
 * Item 7 (home nursing): reuses shop's own saved addresses (shop.customer_addresses via
 * listAddressesAction/saveAddressAction) rather than a second, booking-only address book --
 * a customer manages one set of addresses for the whole account. Only rendered when the
 * selected service is flagged requires_customer_address (see db/migrations/0041).
 */
export function AddressPicker({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (address: Address) => void;
}) {
  const tBooking = useTranslations('Booking');
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewAddressForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAddressesAction()
      .then((rows) => {
        if (cancelled) return;
        setAddresses(rows as Address[]);
        if (!selectedId) {
          const initial = (rows as Address[]).find((a) => a.isDefault) ?? rows[0];
          if (initial) onSelect(initial as Address);
        }
      })
      .catch(() => {
        if (!cancelled) setAddresses([]);
      });
    return () => {
      cancelled = true;
    };
    // Only ever runs once on mount -- onSelect/selectedId changing afterwards must not
    // re-trigger a refetch, or picking an address would immediately refetch and reset itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitNewAddress = async () => {
    setError(null);
    if (!form.fullName.trim() || !form.country.trim() || !form.city.trim() || !form.addressLine1.trim()) {
      setError(tBooking('addressFormIncomplete'));
      return;
    }
    setSaving(true);
    try {
      const result = await saveAddressAction({
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        country: form.country.trim(),
        city: form.city.trim(),
        stateRegion: form.stateRegion.trim() || undefined,
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
      });
      const nextAddresses = result.addresses as Address[];
      setAddresses(nextAddresses);
      const saved = nextAddresses.find((a) => a.id === result.id);
      if (saved) onSelect(saved);
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch {
      setError(tBooking('addressSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (addresses === null) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {tBooking('loadingAddresses')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-900">{tBooking('serviceAddress')}</h3>
      <p className="-mt-1 text-xs text-slate-500">{tBooking('serviceAddressHint')}</p>

      {addresses.length > 0 ? (
        <div className="space-y-2">
          {addresses.map((address) => {
            const selected = selectedId === address.id;
            return (
              <button
                key={address.id}
                type="button"
                onClick={() => onSelect(address)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-start transition ${
                  selected ? 'border-[#083f30] bg-[#083f30]/5 ring-1 ring-[#083f30]/20' : 'border-slate-200 bg-white'
                }`}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900">{address.fullName}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{addressLabel(address)}</div>
                </div>
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                    selected ? 'border-[#083f30] bg-[#083f30]' : 'border-slate-300'
                  }`}
                >
                  {selected ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : !showForm ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          {tBooking('noSavedAddresses')}
        </div>
      ) : null}

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-bold text-[#155e75]"
        >
          <Plus className="h-4 w-4" />
          {tBooking('addNewAddress')}
        </button>
      ) : (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder={tBooking('fullName')}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#155e75]"
            />
            <input
              value={form.phoneNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder={tBooking('phoneNumber')}
              dir="ltr"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#155e75]"
            />
            <input
              value={form.country}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              placeholder={tBooking('country')}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#155e75]"
            />
            <input
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder={tBooking('city')}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#155e75]"
            />
            <input
              value={form.stateRegion}
              onChange={(e) => setForm((prev) => ({ ...prev, stateRegion: e.target.value }))}
              placeholder={tBooking('stateRegion')}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#155e75]"
            />
            <input
              value={form.postalCode}
              onChange={(e) => setForm((prev) => ({ ...prev, postalCode: e.target.value }))}
              placeholder={tBooking('postalCode')}
              dir="ltr"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#155e75]"
            />
            <input
              value={form.addressLine1}
              onChange={(e) => setForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
              placeholder={tBooking('addressLine1')}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#155e75] sm:col-span-2"
            />
            <input
              value={form.addressLine2}
              onChange={(e) => setForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
              placeholder={tBooking('addressLine2')}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#155e75] sm:col-span-2"
            />
          </div>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submitNewAddress}
              disabled={saving}
              className="rounded-xl bg-[#083f30] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? tBooking('saving') : tBooking('saveAddress')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
            >
              {tBooking('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
