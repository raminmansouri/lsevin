import postgres from "postgres";

import { mirrorWalletCredit } from "@/accounting/server/legacy-bridge";
import { getPaymentProvider } from "@/payment/providers";
import { getPaymentGatewayConfig } from "@/payment/server/payment-gateway.repository";
import type { PaymentGatewayCode } from "@/payment/types";

type WalletIntentRow = {
  id: string;
  walletAccountId: string;
  userId: string;
  currencyCode: string;
  amount: string | number;
  status: string;
  gatewayName: string | null;
  gatewayReference: string | null;
  metadata: Record<string, unknown> | null;
};

function createSqlClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is missing.");

  return postgres(databaseUrl, {
    prepare: false,
    max: 4,
    idle_timeout: 10,
    connect_timeout: 10,
  });
}

function normalizeGateway(value?: string | null): PaymentGatewayCode {
  const gateway = String(value || "").trim().toLowerCase();
  if (gateway !== "zarinpal") {
    throw new Error("Unsupported wallet payment gateway.");
  }

  return gateway as PaymentGatewayCode;
}

function jsonb(value: unknown) {
  return JSON.stringify(value ?? {});
}

function getGatewayVerificationAmount(intent: WalletIntentRow) {
  const metadata = intent.metadata || {};
  const amount = Number(metadata.gatewayAmount || intent.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Wallet top-up verification amount is not valid.");
  }

  return Math.round(amount);
}

function getGatewayVerificationCurrency(intent: WalletIntentRow) {
  const metadata = intent.metadata || {};
  return String(metadata.gatewayCurrency || "IRR").toUpperCase();
}

export async function verifyWalletTopUpPayment(input: {
  gateway: string;
  authority: string;
  status?: string | null;
}) {
  const gateway = normalizeGateway(input.gateway);
  const authority = String(input.authority || "").trim();
  if (!authority) {
    return { status: "failed" as const, message: "Payment authority is missing." };
  }

  const sql = createSqlClient();

  try {
    const [intent] = await sql<WalletIntentRow[]>`
      select
        id::text,
        wallet_account_id::text as "walletAccountId",
        user_id::text as "userId",
        currency_code as "currencyCode",
        amount::text,
        status,
        gateway_name as "gatewayName",
        gateway_reference as "gatewayReference",
        metadata
      from customer.wallet_payment_intents
      where gateway_name = ${gateway}
        and gateway_reference = ${authority}
        and intent_type = 'topup'
      order by create_date desc
      limit 1
    `;

    if (!intent) {
      return { status: "failed" as const, message: "Wallet payment intent was not found." };
    }

    if (String(input.status || "").toUpperCase() !== "OK") {
      await sql`
        update customer.wallet_payment_intents
           set status = 'cancelled',
               metadata = coalesce(metadata, '{}'::jsonb) || ${jsonb({
                 callbackStatus: input.status || null,
                 cancelledAt: new Date().toISOString(),
               })}::jsonb,
               last_modified_date = now()
         where id = ${intent.id}::uuid
      `;

      return { status: "cancelled" as const, message: "Wallet top-up payment was cancelled." };
    }

    if (String(intent.status || "").toLowerCase() === "succeeded") {
      return { status: "succeeded" as const, message: "Wallet top-up was already verified." };
    }

    const gatewayConfig = await getPaymentGatewayConfig({ code: gateway, includeSecrets: true });
    if (!gatewayConfig) {
      return { status: "failed" as const, message: `Payment gateway ${gateway} is not configured.` };
    }

    const provider = getPaymentProvider(gateway);
    const verification = await provider.verify(
      {
        authority,
        status: input.status,
        amount: getGatewayVerificationAmount(intent),
        currency: getGatewayVerificationCurrency(intent),
      },
      gatewayConfig
    );

    if (!verification.success) {
      await sql`
        update customer.wallet_payment_intents
           set status = 'failed',
               metadata = coalesce(metadata, '{}'::jsonb) || ${jsonb({
                 verification,
                 failedAt: new Date().toISOString(),
               })}::jsonb,
               last_modified_date = now()
         where id = ${intent.id}::uuid
      `;

      return {
        status: "failed" as const,
        message: verification.message || "Wallet top-up verification failed.",
      };
    }

    await sql.begin(async (tx) => {
      await tx`
        update customer.wallet_payment_intents
           set status = 'succeeded',
               metadata = coalesce(metadata, '{}'::jsonb) || ${jsonb({
                 authority,
                 verification,
                 verifiedAt: new Date().toISOString(),
               })}::jsonb,
               last_modified_date = now()
         where id = ${intent.id}::uuid
      `;

      const [existingTransaction] = await tx<{ id: string }[]>`
        select id::text
        from customer.wallet_transactions
        where payment_intent_id = ${intent.id}::uuid
          and transaction_type = 'topup'
          and status = 'completed'
        limit 1
      `;

      if (!existingTransaction) {
        await tx`
          insert into customer.wallet_transactions (
            wallet_account_id,
            user_id,
            payment_intent_id,
            transaction_type,
            direction,
            status,
            payment_method,
            title,
            subtitle,
            currency_code,
            amount,
            metadata
          ) values (
            ${intent.walletAccountId}::uuid,
            ${intent.userId}::uuid,
            ${intent.id}::uuid,
            'topup',
            'credit',
            'completed',
            'card',
            'Wallet Top-up',
            ${`Paid via ${gatewayConfig.displayName}`},
            ${intent.currencyCode},
            ${Number(intent.amount)},
            ${jsonb({
              gateway,
              authority,
              referenceId: verification.referenceId || null,
              verifiedAt: new Date().toISOString(),
            })}::jsonb
          )
        `;
      }

      // Dual-write to the accounting ledger, in this same transaction. Keyed on the
      // gateway authority, so the browser return and a replayed webhook both resolve to
      // one entry — the legacy dedupe above only guards the legacy row.
      //
      // No-ops until the accounting migrations are applied.
      await mirrorWalletCredit(
        {
          userId: intent.userId,
          currencyCode: intent.currencyCode,
          amount: String(intent.amount),
          idempotencyKey: `deposit:${gateway}:${authority}`,
          sourceType: "deposit",
          counterpartAccountKey: gateway === "btcpay" ? "clearing_btcpay" : "clearing_zarinpal",
          description: `شارژ کیف پول از ${gatewayConfig.displayName}`,
          actorUserId: intent.userId,
        },
        tx as never
      );
    });

    return {
      status: "succeeded" as const,
      message: verification.alreadyVerified ? "Wallet top-up was already verified." : "Wallet top-up completed.",
      referenceId: verification.referenceId || null,
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}
