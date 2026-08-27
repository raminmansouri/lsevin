'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from "next-intl";

type BankAccount = {
    id: string;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    iban: string;
    cardNumber: string;
    note: string;
};
type PaymentMethod = {
    code: string;
    name: string;
    description?: string | null;
    configuration?: { bankAccounts?: BankAccount[] } & Record<string, unknown>;
};
type GatewayOption = {
    code: string;
    displayName: string;
    provider: string;
    currency: string;
};

const RECEIPT_MAX_BYTES = 15 * 1024 * 1024;

function BankAccountCard({ account, t }: { account: BankAccount; t: ReturnType<typeof useTranslations> }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            {account.bankName ? <div className="font-semibold text-slate-900">{account.bankName}</div> : null}
            <dl className="mt-1 space-y-1 text-xs text-slate-600">
                {account.accountHolder ? (
                    <div className="flex justify-between gap-2"><dt>{t("accountHolderLabel")}</dt><dd className="font-medium text-slate-800">{account.accountHolder}</dd></div>
                ) : null}
                {account.cardNumber ? (
                    <div className="flex justify-between gap-2"><dt>{t("cardNumberLabel")}</dt><dd dir="ltr" className="font-mono font-medium text-slate-800">{account.cardNumber}</dd></div>
                ) : null}
                {account.iban ? (
                    <div className="flex justify-between gap-2"><dt>{t("ibanLabel")}</dt><dd dir="ltr" className="font-mono font-medium text-slate-800">{account.iban}</dd></div>
                ) : null}
                {account.accountNumber ? (
                    <div className="flex justify-between gap-2"><dt>{t("accountNumberLabel")}</dt><dd dir="ltr" className="font-mono font-medium text-slate-800">{account.accountNumber}</dd></div>
                ) : null}
            </dl>
            {account.note ? <div className="mt-2 text-xs text-slate-500">{account.note}</div> : null}
        </div>
    );
}

export function PaymentMethodsPanel(props: {
    selected?: string;
    onChange: (code: string) => void;
    receiptFile?: File | null;
    onReceiptFileChange?: (file: File | null) => void;
}) {
    const tBooking = useTranslations("Booking");
    const [items, setItems] = useState<PaymentMethod[]>([]);
    const [gateways, setGateways] = useState<GatewayOption[]>([]);
    const [receiptError, setReceiptError] = useState<string | null>(null);
    useEffect(() => {
        fetch('/api/booking-pro/payments/methods', { cache: 'no-store' })
            .then((res) => res.json())
            .then((data) => setItems(data.items ?? []))
            .catch(() => { });
        fetch('/api/payment-gateways?context=booking_online_card', { cache: 'no-store' })
            .then((res) => res.json())
            .then((data) => setGateways(data.items ?? []))
            .catch(() => { });
    }, []);
    // Fallback only when the methods fetch fails. Mirrors what the server now offers —
    // the online card gateway (Zarinpal) plus wallet. No 'bank': it was a placeholder
    // method that no longer exists server-side.
    const list = items.length ? items : [
        { code: 'gateway_card', name: tBooking('onlineCardPayment'), description: tBooking('chooseEnabledGatewaySuchAsZarinpal') },
        { code: 'wallet', name: tBooking('wallet') },
    ];
    const selectedIsGateway = gateways.some((gateway) => gateway.code === props.selected);
    const onlineCardSelected = props.selected === 'card' || props.selected === 'gateway_card' || selectedIsGateway;

    const handleReceiptChange = (file: File | null) => {
        setReceiptError(null);
        if (!file) {
            props.onReceiptFileChange?.(null);
            return;
        }
        const mimeType = file.type || '';
        if (!mimeType.startsWith('image/') && mimeType !== 'application/pdf') {
            setReceiptError(tBooking('receiptWrongTypeError'));
            props.onReceiptFileChange?.(null);
            return;
        }
        if (file.size > RECEIPT_MAX_BYTES) {
            setReceiptError(tBooking('receiptTooLargeError'));
            props.onReceiptFileChange?.(null);
            return;
        }
        props.onReceiptFileChange?.(file);
    };

    return (<div className="space-y-3">
      {list.map((item) => {
            const isOnlineCard = item.code === 'card' || item.code === 'gateway_card';
            const isBankReceipt = item.code === 'bank_receipt';
            const selected = isOnlineCard ? onlineCardSelected : props.selected === item.code;
            // Only show accounts a customer could actually transfer to -- a row the
            // admin started filling in but left without a card/IBAN/account number
            // isn't a usable destination, even though it's kept in the saved config.
            const bankAccounts = (item.configuration?.bankAccounts ?? []).filter(
                (account) => account.cardNumber || account.iban || account.accountNumber
            );
            return (<div key={item.code} className="space-y-2">
            <button type="button" onClick={() => props.onChange(isOnlineCard ? (gateways[0]?.code ?? 'gateway_card') : item.code)} className={`w-full rounded-2xl border px-4 py-3 text-left ${selected ? 'border-[#083f30] bg-[#083f30]/5' : 'border-slate-200 bg-white'}`}>
              <div className="font-semibold text-slate-900">{isOnlineCard ? tBooking('onlineCardPayment') : item.name}</div>
              {item.description ? <div className="mt-1 text-xs text-slate-500">{item.description}</div> : null}
              {isOnlineCard && !gateways.length ? <div className="mt-1 text-xs text-amber-700">{tBooking("noOnlineGatewayIsEnabledFromAdmin")}</div> : null}
              {isBankReceipt && bankAccounts.length === 0 ? <div className="mt-1 text-xs text-amber-700">{tBooking("noBankAccountConfigured")}</div> : null}
            </button>

            {isOnlineCard && selected ? (<div className="ml-3 space-y-2 border-l border-slate-200 pl-3">
                {gateways.map((gateway) => (<button key={gateway.code} type="button" onClick={() => props.onChange(gateway.code)} className={`w-full rounded-2xl border px-4 py-3 text-left ${props.selected === gateway.code ? 'border-[#083f30] bg-[#083f30]/10' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="font-semibold text-slate-900">{gateway.displayName}</div>
                    <div className="mt-1 text-xs text-slate-500">{tBooking("gatewayChargeCurrency")}{gateway.currency}</div>
                  </button>))}
              </div>) : null}

            {isBankReceipt && selected && bankAccounts.length > 0 ? (
              <div className="ml-3 space-y-3 border-l border-slate-200 pl-3">
                <div className="text-xs font-semibold text-slate-600">{tBooking("bankReceiptAccountsTitle")}</div>
                <p className="text-xs text-slate-500">{tBooking("bankReceiptInstructions")}</p>
                <div className="space-y-2">
                  {bankAccounts.map((account) => (<BankAccountCard key={account.id} account={account} t={tBooking} />))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">{tBooking("uploadReceiptLabel")}</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(event) => handleReceiptChange(event.target.files?.[0] ?? null)}
                    className="mt-1 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#083f30] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                  />
                  {props.receiptFile ? (
                    <div className="mt-1 text-xs text-emerald-700">{props.receiptFile.name}</div>
                  ) : null}
                  {receiptError ? <div className="mt-1 text-xs text-red-600">{receiptError}</div> : null}
                </div>
              </div>
            ) : null}
          </div>);
        })}
    </div>);
}
