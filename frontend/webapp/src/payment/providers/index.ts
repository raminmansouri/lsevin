import { btcpayPaymentProvider } from "./btcpay";
import { zarinpalPaymentProvider } from "./zarinpal";
import type { PaymentGatewayCode, PaymentProvider } from "../types";

const PAYMENT_PROVIDERS: Record<PaymentGatewayCode, PaymentProvider> = {
  zarinpal: zarinpalPaymentProvider,
  btcpay: btcpayPaymentProvider,
};

export function getPaymentProvider(code: PaymentGatewayCode): PaymentProvider {
  const provider = PAYMENT_PROVIDERS[code];
  if (!provider) {
    throw new Error(`Unsupported payment gateway: ${code}`);
  }
  return provider;
}

export function getAvailablePaymentProviders(): PaymentProvider[] {
  return Object.values(PAYMENT_PROVIDERS);
}
