"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import {
  createAccountAction,
  deleteAccountAction,
  toggleAccountActiveAction,
  updateAccountAction,
  type AccountFormState,
} from "../config-actions";

export type TreeAccount = {
  id: string;
  code: string;
  parentId: string | null;
  level: number;
  nameFa: string;
  nameEn: string;
  isActive: boolean;
  isSystem: boolean;
  isPostable: boolean;
  hasPostings: boolean;
};

type Node = TreeAccount & { children: Node[]; parentCode: string };
type OpenForm = { id: string; mode: "child" | "edit" } | null;

const MAX_LEVEL = 9;
const input = "h-9 rounded-md border bg-background px-2 text-sm";
const button = "rounded-md border px-2.5 py-1 text-xs transition hover:bg-muted disabled:opacity-40";

function buildTree(accounts: TreeAccount[]): Node[] {
  const byId = new Map<string, Node>();
  for (const account of accounts) byId.set(account.id, { ...account, children: [], parentCode: "" });
  const roots: Node[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) {
      node.parentCode = parent.code;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sort = (list: Node[]) => {
    list.sort((a, b) => a.code.localeCompare(b.code, "en", { numeric: true }));
    list.forEach((node) => sort(node.children));
  };
  sort(roots);
  return roots;
}

function someInSubtree(node: Node, test: (n: Node) => boolean): boolean {
  return test(node) || node.children.some((child) => someInSubtree(child, test));
}

function subtreeSize(node: Node): number {
  return 1 + node.children.reduce((sum, child) => sum + subtreeSize(child), 0);
}

function suggestSegment(parent: Node): string {
  const segments = parent.children.map((child) => child.code.slice(parent.code.length)).filter((s) => /^\d+$/.test(s));
  if (!segments.length) return parent.level === 1 ? "10" : "01";
  const width = Math.max(...segments.map((s) => s.length));
  const numbers = segments.map(Number);
  const step = numbers.every((n) => n % 10 === 0) ? 10 : 1;
  return String(Math.max(...numbers) + step).padStart(width, "0");
}

function Message({ state }: { state: AccountFormState }) {
  if (state.error) return <p className="mt-1 text-xs text-red-600">{state.error}</p>;
  if (state.ok) return <p className="mt-1 text-xs text-emerald-700">{state.ok}</p>;
  return null;
}

function ChildForm({ parent, onDone }: { parent: Node; onDone: () => void }) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(createAccountAction, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={action} className="mt-2 space-y-2 rounded-lg border border-dashed bg-muted/30 p-3">
      <input type="hidden" name="parentId" value={parent.id} />
      <p className="text-xs font-semibold">زیرحساب جدید برای «{parent.nameFa}»</p>
      {parent.isPostable ? (
        <p className="text-xs text-amber-700">
          این حساب الان سندخور است؛ با افزودن زیرحساب، دیگر مستقیم سند نمی‌خورد و سندها روی زیرحساب‌ها ثبت می‌شوند.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <span dir="ltr" className="flex items-center rounded-md border bg-background font-mono text-sm">
          <span className="px-2 text-muted-foreground">{parent.code}</span>
          <input
            name="segment"
            defaultValue={suggestSegment(parent)}
            inputMode="numeric"
            pattern="\d{1,4}"
            required
            className="h-9 w-16 rounded-e-md border-s px-2 font-bold"
            aria-label="کد زیرحساب"
          />
        </span>
        <input name="nameFa" required placeholder="نام فارسی" className={`${input} w-56`} />
        <input name="nameEn" dir="ltr" placeholder="English name" className={`${input} w-48`} />
        <button disabled={pending} className="h-9 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50">
          افزودن
        </button>
        <button type="button" onClick={onDone} className={button}>انصراف</button>
      </div>
      <Message state={state} />
    </form>
  );
}

function EditForm({ node, onDone }: { node: Node; onDone: () => void }) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(updateAccountAction, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={action} className="mt-2 space-y-2 rounded-lg border border-dashed bg-muted/30 p-3">
      <input type="hidden" name="accountId" value={node.id} />
      {node.children.length ? (
        <p className="text-xs text-muted-foreground">با تغییر کد، کد همهٔ زیرحساب‌های این حساب هم خودکار عوض می‌شود.</p>
      ) : null}
      {node.hasPostings ? (
        <p className="text-xs text-muted-foreground">این حساب سند خورده است؛ اسنادش با کد جدید نمایش داده می‌شوند.</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <span dir="ltr" className="flex items-center rounded-md border bg-background font-mono text-sm">
          {node.parentCode ? <span className="px-2 text-muted-foreground">{node.parentCode}</span> : null}
          <input
            name="segment"
            defaultValue={node.code.slice(node.parentCode.length)}
            inputMode="numeric"
            pattern="\d{1,4}"
            required
            className="h-9 w-16 rounded-md border-s px-2 font-bold"
            aria-label="کد"
          />
        </span>
        <input name="nameFa" required defaultValue={node.nameFa} className={`${input} w-56`} aria-label="نام فارسی" />
        <input name="nameEn" dir="ltr" defaultValue={node.nameEn} className={`${input} w-48`} aria-label="English name" />
        <button disabled={pending} className="h-9 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50">
          ذخیره
        </button>
        <button type="button" onClick={onDone} className={button}>انصراف</button>
      </div>
      <Message state={state} />
    </form>
  );
}

function ToggleButton({ node }: { node: Node }) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(toggleAccountActiveAction, {});
  return (
    <form action={action} className="inline">
      <input type="hidden" name="accountId" value={node.id} />
      <input type="hidden" name="isActive" value={node.isActive ? "false" : "true"} />
      <button disabled={pending} className={button}>{node.isActive ? "غیرفعال" : "فعال"}</button>
      {state.error ? <span className="ms-1 text-xs text-red-600">{state.error}</span> : null}
    </form>
  );
}

function DeleteButton({ node }: { node: Node }) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(deleteAccountAction, {});
  const size = subtreeSize(node);
  return (
    <form
      action={action}
      className="inline"
      onSubmit={(event) => {
        const text = size > 1 ? `حساب ${node.code} و ${size - 1} زیرحسابش حذف شوند؟` : `حساب ${node.code} حذف شود؟`;
        if (!window.confirm(text)) event.preventDefault();
      }}
    >
      <input type="hidden" name="accountId" value={node.id} />
      <button disabled={pending} className={`${button} border-red-200 text-red-600 hover:bg-red-50`}>حذف</button>
      {state.error ? <span className="ms-1 text-xs text-red-600">{state.error}</span> : null}
    </form>
  );
}

function Row({
  node,
  isOpen,
  onToggle,
  canManage,
  open,
  setOpen,
}: {
  node: Node;
  isOpen: boolean;
  onToggle: () => void;
  canManage: boolean;
  open: OpenForm;
  setOpen: (value: OpenForm) => void;
}) {
  const formMode = open?.id === node.id ? open.mode : null;
  const close = useMemo(() => () => setOpen(null), [setOpen]);
  const deletable = !someInSubtree(node, (n) => n.isSystem || n.hasPostings);
  const segment = node.code.slice(node.parentCode.length);

  return (
    <div className={`rounded-lg px-2 py-1.5 hover:bg-muted/40 ${node.isActive ? "" : "opacity-50"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={!node.children.length}
          className="grid h-6 w-6 place-items-center rounded text-xs text-muted-foreground hover:bg-muted disabled:invisible"
          aria-label={isOpen ? "بستن" : "باز کردن"}
        >
          {isOpen ? "▾" : "◂"}
        </button>
        <span dir="ltr" className="font-mono text-sm">
          <span className="text-muted-foreground">{node.parentCode}</span>
          <span className="font-bold">{segment}</span>
        </span>
        <span className={node.level === 1 ? "font-bold" : node.level === 2 ? "font-semibold" : ""}>{node.nameFa}</span>
        {node.isPostable ? <span className="rounded-full bg-emerald-50 px-2 text-[11px] text-emerald-700">سندخور</span> : null}
        {node.isSystem ? <span className="rounded-full bg-amber-50 px-2 text-[11px] text-amber-800">سیستمی</span> : null}
        {node.hasPostings ? <span className="rounded-full bg-sky-50 px-2 text-[11px] text-sky-700">دارای سند</span> : null}
        {!node.isActive ? <span className="rounded-full bg-gray-100 px-2 text-[11px] text-gray-600">غیرفعال</span> : null}
        {canManage ? (
          <span className="ms-auto flex flex-wrap items-center gap-1">
            {node.level < MAX_LEVEL ? (
              <button type="button" className={button} onClick={() => setOpen({ id: node.id, mode: "child" })}>
                + زیرحساب
              </button>
            ) : null}
            <button type="button" className={button} onClick={() => setOpen({ id: node.id, mode: "edit" })}>
              ویرایش
            </button>
            {!node.isSystem ? <ToggleButton node={node} /> : null}
            {deletable ? <DeleteButton node={node} /> : null}
          </span>
        ) : null}
      </div>
      {formMode === "child" ? <ChildForm parent={node} onDone={close} /> : null}
      {formMode === "edit" ? <EditForm node={node} onDone={close} /> : null}
    </div>
  );
}

export function AccountsTree({ accounts, canManage }: { accounts: TreeAccount[]; canManage: boolean }) {
  const roots = useMemo(() => buildTree(accounts), [accounts]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(accounts.filter((account) => account.level === 1).map((account) => account.id))
  );
  const [open, setOpen] = useState<OpenForm>(null);
  const q = query.trim().toLowerCase();

  const matches = (node: Node): boolean =>
    !q ||
    node.code.includes(q) ||
    node.nameFa.toLowerCase().includes(q) ||
    node.nameEn.toLowerCase().includes(q) ||
    node.children.some(matches);

  const toggle = (id: string) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const render = (node: Node) => {
    if (!matches(node)) return null;
    const isOpen = q ? true : expanded.has(node.id);
    return (
      <li key={node.id}>
        <Row node={node} isOpen={isOpen} onToggle={() => toggle(node.id)} canManage={canManage} open={open} setOpen={setOpen} />
        {isOpen && node.children.length ? (
          <ul className="ms-5 border-s border-dashed ps-2">{node.children.map(render)}</ul>
        ) : null}
      </li>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جستجو در کد یا نام حساب…"
          className={`${input} w-72`}
        />
        <button type="button" className={button} onClick={() => setExpanded(new Set(accounts.map((a) => a.id)))}>
          باز کردن همه
        </button>
        <button type="button" className={button} onClick={() => setExpanded(new Set())}>
          بستن همه
        </button>
        <span className="text-xs text-muted-foreground">{accounts.length} حساب</span>
      </div>
      <ul>{roots.map(render)}</ul>
    </div>
  );
}