import type {
  CreateTopUpIntentInput,
  CreateTopUpIntentResult,
} from "./types";

export interface WalletGatewayCreateIntentInput extends CreateTopUpIntentInput {
  intentId: string;
  userId: string;
}

export interface WalletPaymentGateway {
  createTopUpIntent(
    input: WalletGatewayCreateIntentInput
  ): Promise<{
    gatewayName: string;
    gatewayReference?: string | null;
    redirectUrl?: string | null;
    clientSecret?: string | null;
    status: "pending" | "requires_action" | "processing";
    raw?: unknown;
  }>;
}

class NoopWalletPaymentGateway implements WalletPaymentGateway {
  async createTopUpIntent(input: WalletGatewayCreateIntentInput) {
    if (input.paymentMethod === "bank") {
      return {
        gatewayName: "manual-bank-transfer",
        gatewayReference: input.intentId,
        status: "pending" as const,
      };
    }

    throw new Error(
      `Payment method "${input.paymentMethod}" is enabled in the UI but no real PSP adapter is configured yet. Replace NoopWalletPaymentGateway in app/wallet/payment-gateway.ts.`
    );
  }
}

export const walletPaymentGateway: WalletPaymentGateway =
  new NoopWalletPaymentGateway();
