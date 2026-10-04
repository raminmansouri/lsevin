import "server-only";

import sql from "@/config/database/db";
import { createNotificationFromTemplate } from "@/app/[locale]/n/app/mobile/notifications/notification-service";

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
 * Real staff accounts (ADMIN/SUPERADMIN/SUPPORT/AGENT), distinct from
 * consultation.notification_recipients -- that table is just phone numbers an
 * admin typed in (some may not even have a platform account), so it can't
 * receive an in-app/email notification tied to a user id. This is a separate,
 * simple copy of the same role join booking-notifications.ts/bug-reports use
 * for their own admin recipients -- same convention, not shared, per this
 * codebase's existing practice of keeping each feature's recipient query
 * independent of the others' extra joins.
 */
async function getStaffRecipients() {
  const rows = await sql<{ userId: string; email: string | null }[]>`
    select distinct u.id::text as "userId", u.email
    from identity.asp_net_users u
    join identity.asp_net_user_roles ur on ur.user_id = u.id
    join identity.asp_net_roles r on r.id = ur.role_id
    where upper(coalesce(r.normalized_name, r.name, '')) = any (
      array['ADMIN','SUPERADMIN','SUPER_ADMIN','SUPPORT','SUPPORT_AGENT','AGENT']
    )
    limit 50
  `;
  return rows;
}

let consultationAdminTemplateEnsured = false;

/** Same upsert-once-per-process idea as ensureBookingNotificationTemplates. */
async function ensureConsultationAdminNotificationTemplate(): Promise<void> {
  if (consultationAdminTemplateEnsured) return;

  const [row] = await sql<{ exists: boolean }[]>`
    select to_regclass('notify.notification_templates') is not null as exists
  `;
  if (!row?.exists) {
    consultationAdminTemplateEnsured = true;
    return;
  }

  await sql`
    insert into notify.notification_templates (
      template_key, name, notification_type, default_channels,
      title_translations, body_translations
    ) values (
      'consultation.created.admin', 'Consultation request received (admin)', 'consultation', array['in_app', 'email'],
      ${sql.json({ "fa-IR": "درخواست مشاوره جدید", "en-US": "New consultation request" } as never)},
      ${sql.json({
        "fa-IR": "نام: {{fullName}}\nتلفن: {{phone}}\nفوریت: {{urgencyLabel}}",
        "en-US": "Name: {{fullName}}\nPhone: {{phone}}\nUrgency: {{urgencyLabel}}",
      } as never)}
    )
    on conflict (template_key) do update set
      title_translations = excluded.title_translations,
      body_translations = excluded.body_translations,
      default_channels = excluded.default_channels
  `;

  consultationAdminTemplateEnsured = true;
}

/**
 * Additive, best-effort in-app/email reach for real staff accounts, layered
 * next to (never instead of) the SMS blast above -- that blast's recipient
 * list can include numbers with no platform account at all, so this cannot
 * replace it, only extend who notices a new lead.
 */
async function notifyStaffOfConsultationRequest(args: DispatchArgs & { fullName: string; urgencyLabel: string }) {
  try {
    await ensureConsultationAdminNotificationTemplate();
    const staff = await getStaffRecipients();
    for (const recipient of staff) {
      await createNotificationFromTemplate({
        templateKey: "consultation.created.admin",
        locale: "fa-IR",
        recipientUserId: recipient.userId,
        entityType: "consultation_request",
        entityId: args.requestId,
        channels: recipient.email ? ["in_app", "email"] : ["in_app"],
        emailTo: recipient.email,
        fallbackTitle: "New consultation request",
        fallbackBody: `${args.fullName} (${args.phone}) requested a free consultation.`,
        variables: { fullName: args.fullName, phone: args.phone, urgencyLabel: args.urgencyLabel },
        data: { audience: "admin" },
      }).catch((error) => console.error(`notifyStaffOfConsultationRequest failed for ${recipient.userId}`, error));
    }
  } catch (error) {
    console.error("[consultation] staff in-app/email notification threw", error);
  }
}

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

  notifyStaffOfConsultationRequest({ ...args, fullName }).catch((error) =>
    console.error("[consultation] notifyStaffOfConsultationRequest threw", error)
  );

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
