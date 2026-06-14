import * as z from "zod/v4";

export const GetEnabledPaymentGatewaysSchema = z.object({
  context: z.enum(["booking_online_card", "wallet_topup"]).optional().default("booking_online_card"),
});
