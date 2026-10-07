/**
 * Currencies a BTCPay invoice is priced in DIRECTLY, i.e. the booking's own currency is sent
 * to BTCPay unchanged and BTCPay does its own fiat -> crypto conversion. That is one fewer
 * exchange-rate conversion on our side, and the customer pays exactly the amount they saw.
 *
 * A booking in any other currency is converted to the gateway's own currency (USD by default),
 * as before - which needs an exchange rate in finance.exchange_rates.
 *
 * Start conservative: a currency belongs here only if the BTCPay store's rate source can price
 * it (BTCPay -> Store Settings -> Rates). If it can't, invoice creation fails for that
 * currency, so add to this list only after checking. No imports on purpose: the server and the
 * payment panel (client) both read this one file.
 */
export const BTCPAY_PASS_THROUGH_CURRENCIES: readonly string[] = ['USD', 'EUR', 'GBP', 'TRY', 'AED', 'CNY', 'RUB', 'SAR'];

export function btcpayBillsDirectlyIn(currency?: string | null): boolean {
  return BTCPAY_PASS_THROUGH_CURRENCIES.includes(String(currency ?? '').trim().toUpperCase());
}
