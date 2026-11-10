"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod/v4";

import { assertAdmin } from "@/lib/auth/admin-guard";

import { CONSULTATION_TRANSLATION_KEY, type ConsultationActionResult } from "../types";
import {
  getReceiptInstructions,
  listAdminPayments,
  markRefunded,
  receiptsReady,
  rejectReceipt,
  saveReceiptInstructions,
  type AdminPaymentRow,
} from "./session-changes-repository";
import { approveReceiptPayment } from "./video-payment";

const ADMIN_PATH = "/admin/consultation-requests";

function devDetail(error: unknown): string {
  if (process.env.NODE_ENV === "production") return "";
  return ` (${error instanceof Error ? error.message : String(error)})`;
}

export type AdminPaymentsData = {
  /** null until migration 0087 is applied. */
  payments: AdminPaymentRow[] | null;
  receiptInstructions: string | null;
};

/** Receipts waiting for a decision and refunds still owed, plus the transfer instructions. */
export async function listConsultationPaymentsAction(): Promise<ConsultationActionResult<AdminPaymentsData>> {
  await assertAdmin();
  const t = await getTranslations(CONSULTATION_TRANSLATION_KEY);
  try {
    if (!(await receiptsReady())) return { ok: true, data: { payments: null, receiptInstructions: null } };
    const [payments, receiptInstructions] = await Promise.all([listAdminPayments(), getReceiptInstructions()]);
    return { ok: true, data: { payments, receiptInstructions } };
  } catch (error) {
    console.error("[consultation] admin payments list failed", error);
    return { ok: false, error: t("errors.generic") + devDetail(error) };
  }
}

const PaymentIdSchema = z.uuid();

export async function approveReceiptAction(
  paymentId: string
): Promise<ConsultationActionResult<{ outcome: "confirmed" | "refund" }>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(CONSULTATION_TRANSLATION_KEY);
  const id = PaymentIdSchema.safeParse(paymentId);
  if (!id.success) return { ok: false, error: t("errors.invalidForm") };
  try {
    const locale = (await getLocale()).split("-")[0] || "fa";
    const outcome = await approveReceiptPayment(id.data, ctx.userId ?? null, locale);
    if (outcome === "notFound") return { ok: false, error: t("errors.notFound") };
    revalidatePath(ADMIN_PATH);
    return { ok: true, data: { outcome } };
  } catch (error) {
    console.error("[consultation] approving receipt failed", error);
    return { ok: false, error: t("errors.generic") + devDetail(error) };
  }
}

const RejectSchema = z.object({ paymentId: z.uuid(), note: z.string().trim().min(3).max(500) });

export async function rejectReceiptAction(input: {
  paymentId: string;
  note: string;
}): Promise<ConsultationActionResult<void>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(CONSULTATION_TRANSLATION_KEY);
  const parsed = RejectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("admin.payments.noteRequired") };
  try {
    if (!(await rejectReceipt(parsed.data.paymentId, parsed.data.note, ctx.userId ?? null))) {
      return { ok: false, error: t("errors.notFound") };
    }
    revalidatePath(ADMIN_PATH);
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("[consultation] rejecting receipt failed", error);
    return { ok: false, error: t("errors.generic") + devDetail(error) };
  }
}

/** The admin paid the money back (by bank or in the gateway's panel) and records it. */
export async function markRefundedAction(paymentId: string): Promise<ConsultationActionResult<void>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(CONSULTATION_TRANSLATION_KEY);
  const id = PaymentIdSchema.safeParse(paymentId);
  if (!id.success) return { ok: false, error: t("errors.invalidForm") };
  try {
    if (!(await markRefunded(id.data, ctx.userId ?? null))) return { ok: false, error: t("errors.notFound") };
    revalidatePath(ADMIN_PATH);
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("[consultation] marking refund failed", error);
    return { ok: false, error: t("errors.generic") + devDetail(error) };
  }
}

const InstructionsSchema = z.string().trim().max(2000);

/** Where patients outside Iran send the money, shown on their payment screen. */
export async function saveReceiptInstructionsAction(text: string): Promise<ConsultationActionResult<void>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(CONSULTATION_TRANSLATION_KEY);
  const parsed = InstructionsSchema.safeParse(text ?? "");
  if (!parsed.success) return { ok: false, error: t("errors.invalidForm") };
  try {
    await saveReceiptInstructions(parsed.data || null, ctx.userId ?? null);
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("[consultation] saving receipt instructions failed", error);
    return { ok: false, error: t("errors.generic") + devDetail(error) };
  }
}
