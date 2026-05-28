"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LifeBuoy } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  createSupportTicketAction,
  updateSupportTicketAction,
} from "@/features/provider-portal/actions";
import { createSupportTicketSchema } from "@/features/provider-portal/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import { tCommon, tLabel, tStatus } from "../lib/i18n";

import type { ProviderWorkspace, SupportTicketRow } from "../types";

type FormValues = z.infer<typeof createSupportTicketSchema>;

export function SupportManager({
  workspace,
  tickets,
}: {
  workspace: ProviderWorkspace;
  tickets: SupportTicketRow[];
}) {
  const t = useTranslations("ProviderPortal");

  return (
    <div className="space-y-6">
      {workspace.permissions.manageSupport ? (
        <SupportForm providerId={workspace.provider.id} />
      ) : null}

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            {tCommon(t, "supportTickets", "Support tickets")}
          </CardTitle>
          <CardDescription>
            {tCommon(
              t,
              "supportChannelDescription",
              "Provider-to-admin support channel.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tickets.length ? (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{ticket.subject}</h3>
                      <Badge>{tStatus(t, ticket.status)}</Badge>
                      <Badge variant="outline">
                        {tStatus(t, ticket.priority)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {ticket.message}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {workspace.permissions.manageSupport ? (
                    <TicketStatus
                      providerId={workspace.provider.id}
                      ticket={ticket}
                    />
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
              {tCommon(t, "noSupportTicketsYet", "No support tickets yet.")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SupportForm({ providerId }: { providerId: string }) {
  const router = useRouter();
  const t = useTranslations("ProviderPortal");
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(createSupportTicketSchema),
    defaultValues: {
      providerId,
      subject: "",
      message: "",
      priority: "normal",
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const response = await createSupportTicketAction(values);
      if (!response.ok) {
        toast.error(
          response.error ||
            tCommon(
              t,
              "ticketCouldNotBeCreated",
              "Ticket could not be created.",
            ),
        );
        return;
      }
      toast.success(
        tCommon(t, "supportTicketCreated", "Support ticket created."),
      );
      form.reset({ providerId, subject: "", message: "", priority: "normal" });
      router.refresh();
    });
  };

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>
          {tCommon(t, "createSupportTicket", "Create support ticket")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 md:grid-cols-2"
        >
          <input type="hidden" {...form.register("providerId")} />

          <label className="space-y-2">
            <span className="text-sm font-medium">{tLabel(t, "Subject")}</span>
            <Input {...form.register("subject")} disabled={isPending} />
            {form.formState.errors.subject ? (
              <p className="text-xs text-red-600">
                {form.formState.errors.subject.message}
              </p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">{tLabel(t, "Priority")}</span>
            <select
              {...form.register("priority")}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="low">{tStatus(t, "low")}</option>
              <option value="normal">{tStatus(t, "normal")}</option>
              <option value="high">{tStatus(t, "high")}</option>
              <option value="urgent">{tStatus(t, "urgent")}</option>
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">{tLabel(t, "Message")}</span>
            <Textarea
              {...form.register("message")}
              rows={4}
              disabled={isPending}
            />
            {form.formState.errors.message ? (
              <p className="text-xs text-red-600">
                {form.formState.errors.message.message}
              </p>
            ) : null}
          </label>

          <div className="flex justify-end border-t pt-5 md:col-span-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? tCommon(t, "sending", "Sending...")
                : tCommon(t, "createTicket", "Create ticket")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function TicketStatus({
  providerId,
  ticket,
}: {
  providerId: string;
  ticket: SupportTicketRow;
}) {
  const router = useRouter();
  const t = useTranslations("ProviderPortal");
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={ticket.status}
      disabled={isPending}
      onChange={(event) => {
        const status = event.target.value;
        startTransition(async () => {
          const response = await updateSupportTicketAction({
            providerId,
            ticketId: ticket.id,
            status,
          });
          if (!response.ok) {
            toast.error(
              response.error ||
                tCommon(
                  t,
                  "ticketCouldNotBeUpdated",
                  "Ticket could not be updated.",
                ),
            );
            return;
          }
          toast.success(
            tCommon(t, "ticketStatusUpdated", "Ticket status updated."),
          );
          router.refresh();
        });
      }}
      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
    >
      <option value="open">{tStatus(t, "open")}</option>
      <option value="in_progress">{tStatus(t, "in_progress")}</option>
      <option value="resolved">{tStatus(t, "resolved")}</option>
      <option value="closed">{tStatus(t, "closed")}</option>
    </select>
  );
}
