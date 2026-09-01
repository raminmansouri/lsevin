"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { deleteAddressAction, saveAddressAction } from "../actions/checkout.actions";
import type { ShopAddress } from "../api/address.repository";

const EMPTY = {
  fullName: "",
  phoneNumber: "",
  country: "",
  city: "",
  stateRegion: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  company: "",
  isDefault: false,
};

const field = "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#083f30]";

export function AddressBookClient({ initial, locale }: { initial: ShopAddress[]; locale: string }) {
  const t = useTranslations("Shop");
  const [addresses, setAddresses] = useState(initial);
  const [editing, setEditing] = useState<(typeof EMPTY & { id?: string }) | null>(null);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function save() {
    if (!editing) return;
    setErr(null);
    startTransition(async () => {
      try {
        const res = await saveAddressAction({
          ...editing,
          phoneNumber: editing.phoneNumber || undefined,
          stateRegion: editing.stateRegion || undefined,
          addressLine2: editing.addressLine2 || undefined,
          postalCode: editing.postalCode || undefined,
          company: editing.company || undefined,
        });
        setAddresses(res.addresses);
        setEditing(null);
      } catch (e) {
        setErr(e instanceof Error ? e.message : t("somethingWrong"));
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteAddressAction(id);
      setAddresses(res.addresses);
    });
  }

  return (
    <div className="space-y-3 p-4 pb-24">
      {err ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{err}</p> : null}

      {addresses.map((a) => (
        <div key={a.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <div className="flex items-start justify-between">
            <div className="text-sm text-neutral-700">
              <p className="font-semibold text-neutral-900">
                {a.fullName} {a.isDefault ? <span className="ms-1 rounded bg-[#083f30]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#083f30]">★</span> : null}
              </p>
              <p>{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}</p>
              <p>{a.city}, {a.country} {a.postalCode ?? ""}</p>
              {a.phoneNumber ? <p className="text-neutral-500">{a.phoneNumber}</p> : null}
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <button onClick={() => setEditing({ ...EMPTY, ...a })} className="text-[#083f30]">{t("saveAddress")}</button>
              <button onClick={() => remove(a.id)} disabled={pending} className="text-[#e02e2a]">{t("remove")}</button>
            </div>
          </div>
        </div>
      ))}

      {editing ? (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <div className="grid grid-cols-2 gap-2">
            <input className={cn(field, "col-span-2")} placeholder={t("fullName")} value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} />
            <input className={field} placeholder={t("phone")} value={editing.phoneNumber} onChange={(e) => setEditing({ ...editing, phoneNumber: e.target.value })} />
            <input className={field} placeholder={t("company")} value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })} />
            <input className={field} placeholder={t("country")} value={editing.country} onChange={(e) => setEditing({ ...editing, country: e.target.value })} />
            <input className={field} placeholder={t("city")} value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
            <input className={cn(field, "col-span-2")} placeholder={t("stateRegion")} value={editing.stateRegion} onChange={(e) => setEditing({ ...editing, stateRegion: e.target.value })} />
            <input className={cn(field, "col-span-2")} placeholder={t("addressLine1")} value={editing.addressLine1} onChange={(e) => setEditing({ ...editing, addressLine1: e.target.value })} />
            <input className={cn(field, "col-span-2")} placeholder={t("addressLine2")} value={editing.addressLine2} onChange={(e) => setEditing({ ...editing, addressLine2: e.target.value })} />
            <input className={field} placeholder={t("postalCode")} value={editing.postalCode} onChange={(e) => setEditing({ ...editing, postalCode: e.target.value })} />
            <label className="col-span-2 flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={editing.isDefault} onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })} />
              {t("useThisAddress")} ({t("savedAddresses")})
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={save} disabled={pending} className="flex-1 rounded-full bg-[#083f30] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {t("saveAddress")}
            </button>
            <button onClick={() => setEditing(null)} className="rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-semibold">
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="w-full rounded-2xl border-2 border-dashed border-[#083f30]/30 bg-white px-4 py-3 text-sm font-semibold text-[#083f30]"
        >
          + {t("addNewAddress")}
        </button>
      )}
    </div>
  );
}
