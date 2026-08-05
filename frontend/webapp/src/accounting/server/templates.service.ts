import "server-only";

import db from "@/config/database/db";

import { assertAccounting } from "./access";
import { getPanelUser } from "./panel-auth";
import { getBaseCurrency } from "./settings.repository";

/**
 * Document templates and the schedules that fire them.
 *
 * A template is the skeleton of a document that gets entered over and over — rent,
 * a monthly platform fee, a standing settlement. A schedule is a template plus a
 * date rule.
 *
 * Generated documents land as `temporary`, never `posted`. A machine deciding
 * that something belongs in the books, unreviewed, is exactly what the approval
 * ladder exists to prevent — the schedule saves the typing, not the judgement.
 */

export type Frequency = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export class TemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemplateError";
  }
}

function pickName(value: Record<string, string> | null, locale: string, fallback: string): string {
  if (!value) return fallback;
  return value[locale] ?? value.fa ?? value.en ?? Object.values(value)[0] ?? fallback;
}

export type TemplateLine = {
  id: string;
  lineNo: number;
  accountId: string;
  accountCode: string;
  accountName: string;
  side: "debit" | "credit";
  amount: string | null;
  memo: string | null;
};

export type TemplateRow = {
  id: string;
  code: string;
  name: string;
  entryType: string;
  description: string | null;
  isActive: boolean;
  lines: TemplateLine[];
};

export async function listTemplates(locale = "fa"): Promise<TemplateRow[]> {
  await assertAccounting("read");

  const templates = await db<
    {
      id: string;
      code: string;
      name_translations: Record<string, string> | null;
      entry_type: string;
      description: string | null;
      is_active: boolean;
    }[]
  >`
    select id::text as id, code, name_translations, entry_type, description, is_active
      from accounting.entry_templates
     order by code
  `;

  if (templates.length === 0) return [];

  const lines = await db<
    {
      id: string;
      template_id: string;
      line_no: number;
      account_id: string;
      account_code: string;
      account_name: Record<string, string> | null;
      side: "debit" | "credit";
      amount: string | null;
      memo: string | null;
    }[]
  >`
    select tl.id::text as id, tl.template_id::text as template_id, tl.line_no::int,
           tl.account_id::text as account_id, a.code as account_code,
           a.name_translations as account_name, tl.side, tl.amount::text, tl.memo
      from accounting.entry_template_lines tl
      join accounting.accounts a on a.id = tl.account_id
     order by tl.template_id, tl.line_no
  `;

  return templates.map((t) => ({
    id: t.id,
    code: t.code,
    name: pickName(t.name_translations, locale, t.code),
    entryType: t.entry_type,
    description: t.description,
    isActive: t.is_active,
    lines: lines
      .filter((l) => l.template_id === t.id)
      .map((l) => ({
        id: l.id,
        lineNo: l.line_no,
        accountId: l.account_id,
        accountCode: l.account_code,
        accountName: pickName(l.account_name, locale, l.account_code),
        side: l.side,
        amount: l.amount,
        memo: l.memo,
      })),
  }));
}

export async function createTemplate(input: {
  code: string;
  nameFa: string;
  entryType?: string;
  description?: string | null;
  lines: { accountId: string; side: "debit" | "credit"; amount?: string | null; memo?: string | null }[];
}): Promise<{ id: string }> {
  await assertAccounting("configure");
  const user = await getPanelUser();
  if (!user) throw new TemplateError("Not signed in");

  const code = input.code?.trim().toUpperCase();
  if (!code) throw new TemplateError("A code is required");
  if (!input.nameFa?.trim()) throw new TemplateError("A name is required");
  if (input.lines.length < 2) throw new TemplateError("A template needs at least two lines");

  for (const [i, line] of input.lines.entries()) {
    if (!line.accountId) throw new TemplateError(`Line ${i + 1} has no account`);
    if (line.amount && !/^\d+(\.\d+)?$/.test(line.amount)) {
      throw new TemplateError(`Line ${i + 1} amount must be a non-negative number`);
    }
  }

  /*
   * A template with amounts on every line must balance, otherwise every document
   * it produces is born unbalanced and someone has to fix each one by hand. A
   * template with blank amounts is a shape to be filled in and is left alone.
   */
  const priced = input.lines.filter((l) => l.amount);
  if (priced.length === input.lines.length) {
    const debit = priced
      .filter((l) => l.side === "debit")
      .reduce((sum, l) => sum + Number(l.amount), 0);
    const credit = priced
      .filter((l) => l.side === "credit")
      .reduce((sum, l) => sum + Number(l.amount), 0);
    if (Math.abs(debit - credit) > 1e-9) {
      throw new TemplateError("A fully priced template must balance");
    }
  }

  return db.begin(async (tx) => {
    const [template] = await tx<{ id: string }[]>`
      insert into accounting.entry_templates (code, name_translations, entry_type, description, created_by)
      values (${code}, ${tx.json({ fa: input.nameFa.trim() })},
              ${input.entryType ?? "general"}, ${input.description?.trim() || null}, ${user.id})
      returning id::text as id
    `;

    for (const [index, line] of input.lines.entries()) {
      await tx`
        insert into accounting.entry_template_lines (template_id, line_no, account_id, side, amount, memo)
        values (${template.id}, ${index + 1}, ${line.accountId}, ${line.side},
                ${line.amount || null}, ${line.memo?.trim() || null})
      `;
    }

    return { id: template.id };
  });
}

export async function setTemplateActive(id: string, isActive: boolean): Promise<void> {
  await assertAccounting("configure");
  await db`update accounting.entry_templates set is_active = ${isActive} where id = ${id}`;
}

/**
 * Builds a draft document from a template.
 *
 * Draft rather than temporary: applying a template is the accountant starting a
 * document, and they still have to fill in whatever the template left blank.
 */
export async function applyTemplate(
  templateId: string,
  entryDate: string
): Promise<{ id: string; entryNumber: string }> {
  await assertAccounting("operate");
  const user = await getPanelUser();
  if (!user) throw new TemplateError("Not signed in");

  const baseCurrency = await getBaseCurrency();

  return db.begin(async (tx) => {
    const [template] = await tx<
      { id: string; entry_type: string; name_translations: Record<string, string> | null; is_active: boolean }[]
    >`
      select id::text as id, entry_type, name_translations, is_active
        from accounting.entry_templates where id = ${templateId}
    `;
    if (!template) throw new TemplateError("Template not found");
    if (!template.is_active) throw new TemplateError("This template is inactive");

    const [period] = await tx<{ id: string; lock_level: string }[]>`
      select id::text as id, lock_level from accounting.fiscal_periods
       where ${entryDate}::date between starts_on and ends_on limit 1
    `;
    if (!period) throw new TemplateError(`No fiscal period covers ${entryDate}`);
    if (period.lock_level === "hard") throw new TemplateError("That period is locked");

    const [entry] = await tx<{ id: string; entry_number: string }[]>`
      insert into accounting.journal_entries (
        fiscal_period_id, entry_date, description, status, entry_type,
        source_type, idempotency_key, base_currency_code, is_manual,
        created_by, submitted_by, template_id
      ) values (
        ${period.id}, ${entryDate},
        ${pickName(template.name_translations, "fa", "سند از الگو")},
        'draft', ${template.entry_type}, 'manual',
        ${`tpl-${crypto.randomUUID()}`}, ${baseCurrency}, true,
        ${user.id}, ${user.id}, ${templateId}
      )
      returning id::text as id, entry_number::text as entry_number
    `;

    await tx`
      insert into accounting.journal_lines (
        entry_id, line_no, account_id, currency_code, debit_amount, credit_amount,
        base_currency_code, base_debit_amount, base_credit_amount, exchange_rate,
        memo, cost_center_id, project_id
      )
      select ${entry.id}, tl.line_no, tl.account_id,
             coalesce(tl.currency_code, ${baseCurrency}),
             case when tl.side = 'debit'  then coalesce(tl.amount, 0) else 0 end,
             case when tl.side = 'credit' then coalesce(tl.amount, 0) else 0 end,
             ${baseCurrency},
             case when tl.side = 'debit'  then coalesce(tl.amount, 0) else 0 end,
             case when tl.side = 'credit' then coalesce(tl.amount, 0) else 0 end,
             1, tl.memo, tl.cost_center_id, tl.project_id
        from accounting.entry_template_lines tl
       where tl.template_id = ${templateId}
       order by tl.line_no
    `;

    return { id: entry.id, entryNumber: entry.entry_number };
  });
}

// ---------------------------------------------------------------------------
// Recurring schedules
// ---------------------------------------------------------------------------

export type ScheduleRow = {
  id: string;
  code: string;
  templateId: string;
  templateName: string;
  frequency: Frequency;
  intervalCount: number;
  startsOn: string;
  endsOn: string | null;
  nextRunOn: string;
  lastRunAt: string | null;
  isActive: boolean;
  isDue: boolean;
};

export async function listSchedules(locale = "fa"): Promise<ScheduleRow[]> {
  await assertAccounting("read");

  const rows = await db<
    {
      id: string;
      code: string;
      template_id: string;
      name_translations: Record<string, string> | null;
      template_code: string;
      frequency: Frequency;
      interval_count: number;
      starts_on: string;
      ends_on: string | null;
      next_run_on: string;
      last_run_at: string | null;
      is_active: boolean;
      is_due: boolean;
    }[]
  >`
    select s.id::text as id, s.code, s.template_id::text as template_id,
           t.name_translations, t.code as template_code,
           s.frequency, s.interval_count::int, s.starts_on::text, s.ends_on::text,
           s.next_run_on::text, s.last_run_at::text, s.is_active,
           (s.is_active and s.next_run_on <= current_date
              and (s.ends_on is null or s.next_run_on <= s.ends_on)) as is_due
      from accounting.recurring_schedules s
      join accounting.entry_templates t on t.id = s.template_id
     order by s.next_run_on
  `;

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    templateId: r.template_id,
    templateName: pickName(r.name_translations, locale, r.template_code),
    frequency: r.frequency,
    intervalCount: r.interval_count,
    startsOn: r.starts_on,
    endsOn: r.ends_on,
    nextRunOn: r.next_run_on,
    lastRunAt: r.last_run_at,
    isActive: r.is_active,
    isDue: r.is_due,
  }));
}

export async function createSchedule(input: {
  code: string;
  templateId: string;
  frequency: Frequency;
  intervalCount?: number;
  startsOn: string;
  endsOn?: string | null;
}): Promise<{ id: string }> {
  await assertAccounting("configure");
  const user = await getPanelUser();
  if (!user) throw new TemplateError("Not signed in");

  const code = input.code?.trim().toUpperCase();
  if (!code) throw new TemplateError("A code is required");
  if (!input.startsOn) throw new TemplateError("A start date is required");
  if (input.endsOn && input.endsOn < input.startsOn) {
    throw new TemplateError("The end date cannot precede the start date");
  }

  const [row] = await db<{ id: string }[]>`
    insert into accounting.recurring_schedules (
      code, template_id, frequency, interval_count, starts_on, ends_on, next_run_on, created_by
    ) values (
      ${code}, ${input.templateId}, ${input.frequency}, ${input.intervalCount ?? 1},
      ${input.startsOn}, ${input.endsOn || null}, ${input.startsOn}, ${user.id}
    )
    returning id::text as id
  `;

  return { id: row.id };
}

export async function setScheduleActive(id: string, isActive: boolean): Promise<void> {
  await assertAccounting("configure");
  await db`update accounting.recurring_schedules set is_active = ${isActive} where id = ${id}`;
}

/**
 * Generates the documents every due schedule owes.
 *
 * Catches up rather than skipping: a schedule whose next run is three months in
 * the past produces three documents, not one. A missed month is a missing entry
 * in the books, and silently swallowing it is worse than making someone reject
 * three drafts.
 *
 * The advance and the document creation share one transaction and the row is
 * locked, so running this twice at once cannot double-generate.
 */
export async function runDueSchedules(): Promise<{ generated: number; details: string[] }> {
  await assertAccounting("operate");
  const user = await getPanelUser();
  if (!user) throw new TemplateError("Not signed in");

  const baseCurrency = await getBaseCurrency();
  const details: string[] = [];
  let generated = 0;

  const due = await db<{ id: string }[]>`
    select id::text as id from accounting.recurring_schedules
     where is_active and next_run_on <= current_date
       and (ends_on is null or next_run_on <= ends_on)
  `;

  for (const { id } of due) {
    await db.begin(async (tx) => {
      const [schedule] = await tx<
        {
          id: string;
          template_id: string;
          frequency: Frequency;
          interval_count: number;
          next_run_on: string;
          ends_on: string | null;
          created_status: string;
        }[]
      >`
        select id::text as id, template_id::text as template_id, frequency,
               interval_count::int, next_run_on::text, ends_on::text, created_status
          from accounting.recurring_schedules
         where id = ${id}
         for update
      `;
      if (!schedule) return;

      // Re-read under the lock: another run may have advanced it already.
      let runDate = schedule.next_run_on;
      let guard = 0;

      while (
        runDate <= new Date().toISOString().slice(0, 10) &&
        (!schedule.ends_on || runDate <= schedule.ends_on) &&
        guard < 120 // a schedule cannot be more than ten years behind before someone looks
      ) {
        const [period] = await tx<{ id: string; lock_level: string }[]>`
          select id::text as id, lock_level from accounting.fiscal_periods
           where ${runDate}::date between starts_on and ends_on limit 1
        `;

        if (!period || period.lock_level === "hard") {
          details.push(`${runDate}: بدون دورهٔ مالی باز — رد شد`);
        } else {
          const [entry] = await tx<{ entry_number: string }[]>`
            insert into accounting.journal_entries (
              fiscal_period_id, entry_date, description, status, entry_type,
              source_type, idempotency_key, base_currency_code, is_manual,
              created_by, submitted_by, template_id, recurring_schedule_id
            )
            select ${period.id}, ${runDate},
                   coalesce(t.name_translations ->> 'fa', t.code),
                   ${schedule.created_status}, t.entry_type, 'manual',
                   ${`sch-${schedule.id}-${runDate}`}, ${baseCurrency}, true,
                   ${user.id}, ${user.id}, t.id, ${schedule.id}
              from accounting.entry_templates t where t.id = ${schedule.template_id}
            on conflict (idempotency_key) do nothing
            returning entry_number::text as entry_number
          `;

          if (entry) {
            await tx`
              insert into accounting.journal_lines (
                entry_id, line_no, account_id, currency_code, debit_amount, credit_amount,
                base_currency_code, base_debit_amount, base_credit_amount, exchange_rate,
                memo, cost_center_id, project_id
              )
              select e.id, tl.line_no, tl.account_id, coalesce(tl.currency_code, ${baseCurrency}),
                     case when tl.side = 'debit'  then coalesce(tl.amount, 0) else 0 end,
                     case when tl.side = 'credit' then coalesce(tl.amount, 0) else 0 end,
                     ${baseCurrency},
                     case when tl.side = 'debit'  then coalesce(tl.amount, 0) else 0 end,
                     case when tl.side = 'credit' then coalesce(tl.amount, 0) else 0 end,
                     1, tl.memo, tl.cost_center_id, tl.project_id
                from accounting.entry_template_lines tl
                join accounting.journal_entries e
                  on e.recurring_schedule_id = ${schedule.id} and e.entry_date::date = ${runDate}::date
               where tl.template_id = ${schedule.template_id}
               order by tl.line_no
            `;
            generated++;
            details.push(`${runDate}: سند ${entry.entry_number} ساخته شد`);
          }
        }

        const [next] = await tx<{ d: string }[]>`
          select (${runDate}::date + make_interval(
            days   => case when ${schedule.frequency} = 'daily'   then ${schedule.interval_count} else 0 end,
            weeks  => case when ${schedule.frequency} = 'weekly'  then ${schedule.interval_count} else 0 end,
            months => case
                        when ${schedule.frequency} = 'monthly'   then ${schedule.interval_count}
                        when ${schedule.frequency} = 'quarterly' then ${schedule.interval_count} * 3
                        else 0 end,
            years  => case when ${schedule.frequency} = 'yearly'  then ${schedule.interval_count} else 0 end
          ))::date::text as d
        `;
        runDate = next.d;
        guard++;
      }

      await tx`
        update accounting.recurring_schedules
           set next_run_on = ${runDate}::date, last_run_at = now()
         where id = ${schedule.id}
      `;
    });
  }

  return { generated, details };
}
