import "server-only";

import db from "@/config/database/db";

import { assertAccounting } from "./access";
import { getPanelUser } from "./panel-auth";

/**
 * Cost centres, projects, branches and departments.
 *
 * These are the axes every report slices by, so they are configuration rather
 * than data — creating one is a `configure` act, not an `operate` one. A
 * dimension is never deleted once anything has been posted against it, because
 * that would silently rewrite history; it is deactivated instead.
 */

export type DimensionKind = "cost_center" | "project" | "branch" | "department";

export const DIMENSION_KINDS: DimensionKind[] = [
  "cost_center",
  "project",
  "branch",
  "department",
];

export class DimensionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DimensionError";
  }
}

export type DimensionRow = {
  id: string;
  kind: DimensionKind;
  code: string;
  nameTranslations: Record<string, string>;
  name: string;
  budgetAmount: string | null;
  budgetCurrency: string | null;
  startsOn: string | null;
  endsOn: string | null;
  isActive: boolean;
  description: string | null;
  usageCount: number;
};

function pickName(value: Record<string, string> | null, locale: string, fallback: string): string {
  if (!value) return fallback;
  return value[locale] ?? value.fa ?? value.en ?? Object.values(value)[0] ?? fallback;
}

export async function listAllDimensions(locale = "fa"): Promise<DimensionRow[]> {
  await assertAccounting("read");

  const rows = await db<
    {
      id: string;
      kind: DimensionKind;
      code: string;
      name_translations: Record<string, string> | null;
      budget_amount: string | null;
      budget_currency: string | null;
      starts_on: string | null;
      ends_on: string | null;
      is_active: boolean;
      description: string | null;
      usage_count: number;
    }[]
  >`
    select d.id::text as id, d.kind, d.code, d.name_translations,
           d.budget_amount::text, d.budget_currency,
           d.starts_on::text, d.ends_on::text, d.is_active, d.description,
           (
             select count(*)::int from accounting.journal_lines l
              where l.cost_center_id = d.id
                 or l.project_id = d.id
                 or l.branch_id = d.id
                 or l.department_id = d.id
           ) as usage_count
      from accounting.dimensions d
     order by d.kind, d.code
  `;

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    code: r.code,
    nameTranslations: r.name_translations ?? {},
    name: pickName(r.name_translations, locale, r.code),
    budgetAmount: r.budget_amount,
    budgetCurrency: r.budget_currency,
    startsOn: r.starts_on,
    endsOn: r.ends_on,
    isActive: r.is_active,
    description: r.description,
    usageCount: r.usage_count,
  }));
}

export type CreateDimensionInput = {
  kind: DimensionKind;
  code: string;
  nameFa: string;
  nameEn?: string;
  budgetAmount?: string | null;
  budgetCurrency?: string | null;
  startsOn?: string | null;
  endsOn?: string | null;
  description?: string | null;
};

export async function createDimension(input: CreateDimensionInput): Promise<{ id: string }> {
  await assertAccounting("configure");
  const user = await getPanelUser();
  if (!user) throw new DimensionError("Not signed in");

  const code = input.code?.trim().toUpperCase();
  if (!code) throw new DimensionError("A code is required");
  if (!/^[A-Z0-9][A-Z0-9_-]{0,29}$/.test(code)) {
    throw new DimensionError("The code may use letters, digits, dash and underscore only");
  }
  if (!input.nameFa?.trim()) throw new DimensionError("A Persian name is required");
  if (!DIMENSION_KINDS.includes(input.kind)) throw new DimensionError("Unknown dimension kind");

  if (input.budgetAmount && !/^\d+(\.\d+)?$/.test(input.budgetAmount)) {
    throw new DimensionError("The budget must be a non-negative number");
  }
  if (input.budgetAmount && !input.budgetCurrency) {
    throw new DimensionError("A budget needs a currency");
  }
  if (input.startsOn && input.endsOn && input.endsOn < input.startsOn) {
    throw new DimensionError("The end date cannot precede the start date");
  }

  const names: Record<string, string> = { fa: input.nameFa.trim() };
  if (input.nameEn?.trim()) names.en = input.nameEn.trim();

  const [existing] = await db<{ id: string }[]>`
    select id::text as id from accounting.dimensions
     where kind = ${input.kind} and code = ${code}
  `;
  if (existing) throw new DimensionError(`A ${input.kind} with code ${code} already exists`);

  const [row] = await db<{ id: string }[]>`
    insert into accounting.dimensions (
      kind, code, name_translations, budget_amount, budget_currency,
      starts_on, ends_on, description, created_by
    ) values (
      ${input.kind}, ${code}, ${db.json(names)},
      ${input.budgetAmount || null}, ${input.budgetCurrency || null},
      ${input.startsOn || null}, ${input.endsOn || null},
      ${input.description?.trim() || null}, ${user.id}
    )
    returning id::text as id
  `;

  return { id: row.id };
}

/**
 * Turns a dimension on or off.
 *
 * Never a delete. Once a line references a dimension, removing it would change
 * what a posted document says — and the ledger's whole premise is that a posted
 * document does not change.
 */
export async function setDimensionActive(id: string, isActive: boolean): Promise<void> {
  await assertAccounting("configure");

  const [row] = await db<{ id: string }[]>`
    update accounting.dimensions
       set is_active = ${isActive}, updated_at = now()
     where id = ${id}
     returning id::text as id
  `;
  if (!row) throw new DimensionError("Dimension not found");
}

export async function updateDimensionBudget(
  id: string,
  budgetAmount: string | null,
  budgetCurrency: string | null
): Promise<void> {
  await assertAccounting("configure");

  if (budgetAmount && !/^\d+(\.\d+)?$/.test(budgetAmount)) {
    throw new DimensionError("The budget must be a non-negative number");
  }
  if (budgetAmount && !budgetCurrency) {
    throw new DimensionError("A budget needs a currency");
  }

  const [row] = await db<{ id: string }[]>`
    update accounting.dimensions
       set budget_amount = ${budgetAmount || null},
           budget_currency = ${budgetCurrency || null},
           updated_at = now()
     where id = ${id}
     returning id::text as id
  `;
  if (!row) throw new DimensionError("Dimension not found");
}
