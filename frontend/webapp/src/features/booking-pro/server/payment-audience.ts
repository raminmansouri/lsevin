import 'server-only';

export type PaymentAudience = 'iran' | 'international' | 'all';

// Who may use each method when its configuration has no `audience` of its own.
// A code that isn't listed defaults to 'iran': a new method stays hidden from
// foreign visitors until someone explicitly marks it for them.
const DEFAULT_AUDIENCE: Record<string, PaymentAudience> = {
    wallet: 'all',
    // Online card is a container for gateways. Which gateway a visitor gets (Zarinpal for
    // Iran, BTCPay for everyone else) is decided by the region logic in
    // listPaymentMethodsForUser, so this method itself is open to everyone.
    gateway_card: 'all',
    manual_card: 'all',
    pay_on_delivery: 'all',
    cash_on_delivery: 'all',
    bank_receipt: 'all',
};

export function audienceOf(code: string, configuration?: Record<string, any> | null): PaymentAudience {
    const configured = configuration?.audience;
    if (configured === 'iran' || configured === 'international' || configured === 'all') return configured;
    return DEFAULT_AUDIENCE[code] ?? 'iran';
}

/**
 * Returns the method as this visitor may see it, or null if they may not use it.
 * Bank receipts also hide the other audience's accounts, so a foreign visitor never
 * receives an Iranian card number. An account with no `audience` counts as Iranian
 * (every account entered so far is). A bank receipt with no account left is hidden.
 */
export function applyAudience<T extends { code: string; configuration?: Record<string, any> | null }>(
    method: T,
    isIranian: boolean,
): T | null {
    const configuration = method.configuration ?? {};
    const audience = audienceOf(method.code, configuration);
    if (audience !== 'all' && audience !== (isIranian ? 'iran' : 'international')) return null;

    if (method.code === 'bank_receipt' && Array.isArray(configuration.bankAccounts)) {
        const accounts = configuration.bankAccounts.filter((account: any) => {
            const accountAudience = account?.audience === 'international' ? 'international' : 'iran';
            return accountAudience === (isIranian ? 'iran' : 'international');
        });
        if (accounts.length === 0) return null;
        return { ...method, configuration: { ...configuration, bankAccounts: accounts } };
    }

    return method;
}