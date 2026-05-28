'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from "next-intl";
type PaymentMethod = {
    code: string;
    name: string;
    description?: string | null;
};
type GatewayOption = {
    code: string;
    displayName: string;
    provider: string;
    currency: string;
};
export function PaymentMethodsPanel(props: {
    selected?: string;
    onChange: (code: string) => void;
}) {
    const tBooking = useTranslations("Booking");
    const [items, setItems] = useState<PaymentMethod[]>([]);
    const [gateways, setGateways] = useState<GatewayOption[]>([]);
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
    const list = items.length ? items : [
        { code: 'gateway_card', name: tBooking('onlineCardPayment'), description: tBooking('chooseEnabledGatewaySuchAsZarinpal') },
        { code: 'bank', name: tBooking('bankTransfer') },
        { code: 'wallet', name: tBooking('wallet') },
    ];
    const selectedIsGateway = gateways.some((gateway) => gateway.code === props.selected);
    const onlineCardSelected = props.selected === 'card' || props.selected === 'gateway_card' || selectedIsGateway;
    return (<div className="space-y-3">
      {list.map((item) => {
            const isOnlineCard = item.code === 'card' || item.code === 'gateway_card';
            const selected = isOnlineCard ? onlineCardSelected : props.selected === item.code;
            return (<div key={item.code} className="space-y-2">
            <button type="button" onClick={() => props.onChange(isOnlineCard ? (gateways[0]?.code ?? 'gateway_card') : item.code)} className={`w-full rounded-2xl border px-4 py-3 text-left ${selected ? 'border-[#083f30] bg-[#083f30]/5' : 'border-slate-200 bg-white'}`}>
              <div className="font-semibold text-slate-900">{isOnlineCard ? tBooking('onlineCardPayment') : item.name}</div>
              {item.description ? <div className="mt-1 text-xs text-slate-500">{item.description}</div> : null}
              {isOnlineCard && !gateways.length ? <div className="mt-1 text-xs text-amber-700">{tBooking("noOnlineGatewayIsEnabledFromAdmin")}</div> : null}
            </button>

            {isOnlineCard && selected ? (<div className="ml-3 space-y-2 border-l border-slate-200 pl-3">
                {gateways.map((gateway) => (<button key={gateway.code} type="button" onClick={() => props.onChange(gateway.code)} className={`w-full rounded-2xl border px-4 py-3 text-left ${props.selected === gateway.code ? 'border-[#083f30] bg-[#083f30]/10' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="font-semibold text-slate-900">{gateway.displayName}</div>
                    <div className="mt-1 text-xs text-slate-500">{tBooking("gatewayChargeCurrency")}{gateway.currency}</div>
                  </button>))}
              </div>) : null}
          </div>);
        })}
    </div>);
}
