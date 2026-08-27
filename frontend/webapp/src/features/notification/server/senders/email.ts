import "server-only";

import nodemailer from "nodemailer";

import type { NotificationChannelSettings } from "../channel.repository";
import type { DeliveryToSend, SendResult } from "./types";

export async function sendEmail(delivery: DeliveryToSend, settings: NotificationChannelSettings): Promise<SendResult> {
  if (!delivery.recipientEmail) return { ok: false, error: "No recipient email address." };
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
    return { ok: false, error: "SMTP is not configured." };
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: Boolean(settings.smtpSecure),
    auth: { user: settings.smtpUser, pass: settings.smtpPassword },
  });

  const subject = delivery.channelContent?.email?.subject || delivery.title;
  const body = delivery.channelContent?.email?.body || delivery.body;
  const fromAddress = settings.fromAddress || settings.smtpUser;
  const from = settings.fromName ? `"${settings.fromName}" <${fromAddress}>` : fromAddress;

  try {
    const info = await transporter.sendMail({
      from,
      to: delivery.recipientEmail,
      subject,
      text: body,
    });
    return { ok: true, providerResponse: info.messageId };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown SMTP error" };
  }
}
