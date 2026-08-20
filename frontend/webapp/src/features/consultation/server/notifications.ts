import "server-only";

import { isIranianMobile } from "../schemas";
import {
  encodePatternVariables,
  maskPhone,
  readMeliPayamakCredentials,
  sendPatternSms,
} from "./melipayamak";
import {
  getConsultationSmsSettings,
  listActiveRecipientPhones,
  recordNotificationAttempt,
} from "./repository";

/**
 * Announces a new consultation request by SMS — once to the customer, once to each
 * configured admin number.
 *
 * ## The templates this expects
 *
 * MeliPayamak pattern mode renders a body that was approved in the provider's
 * panel and accepts only its variables, semicolon-separated and **in order**. So
 * the two patterns have to be registered to match these argument lists exactly;
 * a mismatch comes back as provider error -5 rather than a wrong-looking message.
 *
 *   customer pattern (sms.customer_body_id) — 1 variable:
 *     {0} = customer's first name
 *     e.g. "{0} عزیز، درخواست مشاوره رایگان شما ثبت شد. کارشناسان ما به زودی با شما تماس می‌گیرند."
 *
 *   admin pattern (sms.admin_body_id) — 3 variables:
 *     {0} = full name, {1} = phone, {2} = urgency label
 *     e.g. "درخواست مشاوره جدید — {0} — {1} — فوریت: {2}"
 *
 * ## Failure policy
 *
 * Nothing in here throws. The request is already saved by the time this runs, and
 * losing an SMS must not lose the lead or show the customer an error for something
 * they cannot act on. Every outcome — sent, failed, or deliberately skipped — is
 * written to consultation.request_notifications so the admin panel can show it.
 */

type DispatchArgs = {
  requestId: string;
  firstName: string;
  lastName: string;
  phone: string;
  urgencyLabel: string;
};

type SkipReason =
  | "sms_disabled"
  | "no_credentials"
  | "no_body_id"
  | "not_iranian_mobile"
  | "no_recipients";

async function skip(
  requestId: string,
  recipientType: "customer" | "admin",
  phone: string,
  bodyId: string | null,
  reason: SkipReason
) {
  await recordNotificationAttempt({
    requestId,
    recipientType,
    phone,
    bodyId,
    variables: null,
    status: "skipped",
    skipReason: reason,
  });
}

export async function dispatchConsultationNotifications(
  args: DispatchArgs
): Promise<void> {
  const fullName = [args.firstName, args.lastName].filter(Boolean).join(" ").trim();

  let settings;
  let recipients;

  try {
    [settings, recipients] = await Promise.all([
      getConsultationSmsSettings(),
      listActiveRecipientPhones(),
    ]);
  } catch (error) {
    // If we cannot even read the configuration there is nowhere to record the
    // outcome either, so this is the one path that only logs.
    console.error("[consultation] failed to load notification config", error);
    return;
  }

  const credentials = readMeliPayamakCredentials();

  const blanketSkip = !settings.enabled
    ? ("sms_disabled" as const)
    : !credentials
      ? ("no_credentials" as const)
      : null;

  // ---- customer -----------------------------------------------------------
  try {
    if (blanketSkip) {
      await skip(args.requestId, "customer", args.phone, null, blanketSkip);
    } else if (!settings.customerBodyId) {
      await skip(args.requestId, "customer", args.phone, null, "no_body_id");
    } else if (!isIranianMobile(args.phone)) {
      // MeliPayamak only delivers to Iranian mobiles. Recording this rather than
      // attempting it keeps a foreign lead from looking like a provider fault.
      await skip(
        args.requestId,
        "customer",
        args.phone,
        settings.customerBodyId,
        "not_iranian_mobile"
      );
    } else {
      const variables = encodePatternVariables([args.firstName]);
      const result = await sendPatternSms({
        to: args.phone,
        bodyId: settings.customerBodyId,
        variables,
        credentials: credentials!,
      });

      await recordNotificationAttempt({
        requestId: args.requestId,
        recipientType: "customer",
        phone: args.phone,
        bodyId: settings.customerBodyId,
        variables,
        status: result.ok ? "sent" : "failed",
        providerMessageId: result.ok ? result.messageId : null,
        errorMessage: result.ok ? null : result.error,
      });

      if (!result.ok) {
        console.error(
          `[consultation] customer SMS failed for ${maskPhone(args.phone)}: ${result.error}`
        );
      }
    }
  } catch (error) {
    console.error("[consultation] customer notification threw", error);
  }

  // ---- admins -------------------------------------------------------------
  try {
    if (recipients.length === 0) {
      await skip(args.requestId, "admin", "", null, "no_recipients");
      return;
    }

    if (blanketSkip) {
      await Promise.all(
        recipients.map((recipient) =>
          skip(args.requestId, "admin", recipient.phone, null, blanketSkip)
        )
      );
      return;
    }

    if (!settings.adminBodyId) {
      await Promise.all(
        recipients.map((recipient) =>
          skip(args.requestId, "admin", recipient.phone, null, "no_body_id")
        )
      );
      return;
    }

    const variables = encodePatternVariables([fullName, args.phone, args.urgencyLabel]);

    // One HTTP call per admin. The endpoint's `to` does accept a comma-separated
    // list, but then a single bad number fails the whole batch and the panel
    // cannot say which admin missed the alert.
    await Promise.all(
      recipients.map(async (recipient) => {
        if (!isIranianMobile(recipient.phone)) {
          await skip(
            args.requestId,
            "admin",
            recipient.phone,
            settings.adminBodyId,
            "not_iranian_mobile"
          );
          return;
        }

        const result = await sendPatternSms({
          to: recipient.phone,
          bodyId: settings.adminBodyId!,
          variables,
          credentials: credentials!,
        });

        await recordNotificationAttempt({
          requestId: args.requestId,
          recipientType: "admin",
          phone: recipient.phone,
          bodyId: settings.adminBodyId,
          variables,
          status: result.ok ? "sent" : "failed",
          providerMessageId: result.ok ? result.messageId : null,
          errorMessage: result.ok ? null : result.error,
        });

        if (!result.ok) {
          console.error(
            `[consultation] admin SMS failed for ${maskPhone(recipient.phone)}: ${result.error}`
          );
        }
      })
    );
  } catch (error) {
    console.error("[consultation] admin notification threw", error);
  }
}
