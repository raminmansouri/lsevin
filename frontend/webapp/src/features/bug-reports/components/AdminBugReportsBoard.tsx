"use client";

import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  History,
  Inbox,
  LayoutGrid,
  List,
  MessageSquare,
  Paperclip,
  UserRound,
  RefreshCw,
  Search,
} from "lucide-react";
import { ReactNode, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Link } from "@/i18n/navigation";

import { assignBugReportAction, updateBugReportBoardColumnsAction, updateBugReportPriorityAction, updateBugReportStatusAction } from "../actions";
import { BUG_REPORT_COPY, normalizeBugReportLocale } from "../copy";
import {
  AdminBugReportFilters,
  AdminBugReportPageInfo,
  BUG_REPORT_AREAS,
  BUG_REPORT_PRIORITIES,
  BUG_REPORT_SEVERITIES,
  BUG_REPORT_STATUSES,
  BugReportAssignableAgent,
  BugReportBoardColumn,
  BugReportCard,
  BugReportRecentChange,
  BugReportPriority,
  BugReportStatus,
} from "../types";

type BoardStats = {
  total: number;
  active: number;
  needInfo: number;
  resolved: number;
  critical: number;
  unassigned: number;
};

type Props = {
  locale: string;
  items?: BugReportCard[];
  stats?: Partial<BoardStats>;
  filters: AdminBugReportFilters;
  pageInfo?: Partial<AdminBugReportPageInfo>;
  recentChanges?: BugReportRecentChange[];
  agents?: BugReportAssignableAgent[];
  boardColumns?: BugReportBoardColumn[];
};

const EMPTY_STATS: BoardStats = {
  total: 0,
  active: 0,
  needInfo: 0,
  resolved: 0,
  critical: 0,
  unassigned: 0,
};

const DEFAULT_BOARD_COLUMNS: BugReportBoardColumn[] = [
  { key: "open", statuses: ["open"], title: "open", labelTranslations: { en: "Open", fa: "باز", ar: "مفتوح" }, displayOrder: 10, isEnabled: true },
  { key: "triaged", statuses: ["triaged"], title: "triaged", labelTranslations: { en: "Triaged", fa: "بررسی اولیه", ar: "تم الفرز" }, displayOrder: 20, isEnabled: true },
  { key: "in_progress", statuses: ["in_progress"], title: "in_progress", labelTranslations: { en: "In progress", fa: "در حال انجام", ar: "قيد التنفيذ" }, displayOrder: 30, isEnabled: true },
  { key: "need_info", statuses: ["need_info"], title: "need_info", labelTranslations: { en: "Need info", fa: "نیازمند اطلاعات", ar: "بحاجة إلى معلومات" }, displayOrder: 40, isEnabled: true },
  { key: "done", statuses: ["resolved", "closed", "duplicate", "wont_fix"], title: "resolved", labelTranslations: { en: "Done", fa: "انجام‌شده", ar: "منجز" }, displayOrder: 50, isEnabled: true },
];

const ADMIN_BOARD_LABELS = {
  en: {
    qaBoard: "QA board",
    autoRefresh: "Auto refresh every 45s",
    lastRefresh: "Last refresh",
    total: "Total",
    active: "Active",
    needInfo: "Need info",
    resolved: "Resolved",
    critical: "Critical",
    unassignedStat: "Unassigned",
    searchPlaceholder: "Search title, report number, email, message...",
    filter: "Filter",
    showingPrefix: "Showing",
    showingOf: "of",
    showingSuffix: "matching reports",
    board: "Board",
    list: "List",
    previous: "Prev",
    next: "Next",
    page: "Page",
    report: "Report",
    status: "Status",
    reporter: "Reporter",
    owner: "Owner",
    activity: "Activity",
    updatedByOther: "Updated by other",
    noMatchingReports: "No reports match these filters.",
    unread: "unread",
    unknown: "Unknown",
    unassigned: "Unassigned",
    messages: "messages",
    files: "files",
    assigned: "Assigned",
    anotherUser: "another user",
    updatedBadge: "Updated",
    noReports: "No reports",
    last7Changes: "Last 7 changes",
    liveContext: "Live context above the cards",
    noRecentChanges: "No recent changes found for the current filters.",
    changedIn: "in",
    assignTo: "Assign to",
    quickControls: "Manage",
    columnSettings: "Column names",
    saveColumnNames: "Save column names",
    openCard: "Open details",
  },
  fa: {
    qaBoard: "برد کنترل کیفیت",
    autoRefresh: "به‌روزرسانی خودکار هر ۴۵ ثانیه",
    lastRefresh: "آخرین به‌روزرسانی",
    total: "کل",
    active: "فعال",
    needInfo: "نیازمند اطلاعات",
    resolved: "حل‌شده",
    critical: "بحرانی",
    unassignedStat: "بدون مسئول",
    searchPlaceholder: "جستجو در عنوان، شماره گزارش، ایمیل یا پیام...",
    filter: "فیلتر",
    showingPrefix: "نمایش",
    showingOf: "از",
    showingSuffix: "گزارش مطابق فیلترها",
    board: "برد",
    list: "لیست",
    previous: "قبلی",
    next: "بعدی",
    page: "صفحه",
    report: "گزارش",
    status: "وضعیت",
    reporter: "گزارش‌دهنده",
    owner: "مسئول",
    activity: "فعالیت",
    updatedByOther: "به‌روزرسانی توسط دیگران",
    noMatchingReports: "هیچ گزارشی با این فیلترها پیدا نشد.",
    unread: "خوانده‌نشده",
    unknown: "نامشخص",
    unassigned: "بدون مسئول",
    messages: "پیام",
    files: "فایل",
    assigned: "مسئول",
    anotherUser: "کاربر دیگر",
    updatedBadge: "به‌روز شده",
    noReports: "گزارشی وجود ندارد",
    last7Changes: "۷ تغییر آخر",
    liveContext: "خلاصه تغییرات بالای کارت‌ها",
    noRecentChanges: "تغییر جدیدی برای فیلترهای فعلی پیدا نشد.",
    changedIn: "در",
    assignTo: "ارجاع به",
    quickControls: "مدیریت",
    columnSettings: "نام ستون‌ها",
    saveColumnNames: "ذخیره نام ستون‌ها",
    openCard: "مشاهده جزئیات",
  },
  ar: {
    qaBoard: "لوحة الجودة",
    autoRefresh: "تحديث تلقائي كل 45 ثانية",
    lastRefresh: "آخر تحديث",
    total: "الإجمالي",
    active: "نشط",
    needInfo: "بحاجة إلى معلومات",
    resolved: "تم الحل",
    critical: "حرج",
    unassignedStat: "غير مخصص",
    searchPlaceholder: "ابحث في العنوان أو رقم التقرير أو البريد أو الرسالة...",
    filter: "تصفية",
    showingPrefix: "عرض",
    showingOf: "من",
    showingSuffix: "تقرير مطابق",
    board: "اللوحة",
    list: "القائمة",
    previous: "السابق",
    next: "التالي",
    page: "صفحة",
    report: "التقرير",
    status: "الحالة",
    reporter: "المُبلّغ",
    owner: "المسؤول",
    activity: "النشاط",
    updatedByOther: "تحديث بواسطة آخرين",
    noMatchingReports: "لا توجد تقارير مطابقة لهذه الفلاتر.",
    unread: "غير مقروء",
    unknown: "غير معروف",
    unassigned: "غير مخصص",
    messages: "رسائل",
    files: "ملفات",
    assigned: "المسؤول",
    anotherUser: "مستخدم آخر",
    updatedBadge: "مُحدّث",
    noReports: "لا توجد تقارير",
    last7Changes: "آخر 7 تغييرات",
    liveContext: "سياق مباشر أعلى البطاقات",
    noRecentChanges: "لم يتم العثور على تغييرات حديثة للفلاتر الحالية.",
    changedIn: "في",
    assignTo: "إسناد إلى",
    quickControls: "إدارة",
    columnSettings: "أسماء الأعمدة",
    saveColumnNames: "حفظ أسماء الأعمدة",
    openCard: "فتح التفاصيل",
  },
} as const;

const VALUE_LABELS: Record<string, Record<string, string>> = {
  fa: {
    all: "همه",
    board: "برد",
    list: "لیست",
    open: "باز",
    triaged: "بررسی اولیه شده",
    in_progress: "در حال انجام",
    need_info: "نیازمند اطلاعات",
    resolved: "حل‌شده",
    closed: "بسته‌شده",
    duplicate: "تکراری",
    wont_fix: "بدون اقدام",
    low: "کم",
    medium: "متوسط",
    high: "زیاد",
    urgent: "فوری",
    critical: "بحرانی",
    normal: "عادی",
    booking: "رزرو",
    profile: "پروفایل",
    payments: "پرداخت‌ها",
    search: "جستجو",
    provider_portal: "پنل ارائه‌دهنده",
    admin: "ادمین",
    mobile_app: "اپ موبایل",
    web_app: "وب اپ",
    other: "سایر",
    status_changed: "تغییر وضعیت",
    assignee_changed: "تغییر مسئول",
    agent_replied: "پاسخ پشتیبانی",
    customer_replied: "پاسخ مشتری",
    internal_note_added: "یادداشت داخلی",
    priority_changed: "تغییر اولویت",
    bug_archived: "آرشیو گزارش",
    assigned_to_me: "ارجاع‌شده به من",
    unassigned: "بدون مسئول",
    customer_app: "اپ مشتری",
    payment: "پرداخت",
    media: "رسانه",
    website: "وب‌سایت",
  },
  ar: {
    all: "الكل",
    board: "اللوحة",
    list: "القائمة",
    open: "مفتوح",
    triaged: "تم الفرز",
    in_progress: "قيد التنفيذ",
    need_info: "بحاجة إلى معلومات",
    resolved: "تم الحل",
    closed: "مغلق",
    duplicate: "مكرر",
    wont_fix: "لن يتم إصلاحه",
    low: "منخفض",
    medium: "متوسط",
    high: "عالٍ",
    urgent: "عاجل",
    critical: "حرج",
    normal: "عادي",
    booking: "الحجز",
    profile: "الملف الشخصي",
    payments: "المدفوعات",
    search: "البحث",
    provider_portal: "بوابة المزود",
    admin: "الإدارة",
    mobile_app: "تطبيق الهاتف",
    web_app: "تطبيق الويب",
    other: "أخرى",
    status_changed: "تغيير الحالة",
    assignee_changed: "تغيير المسؤول",
    agent_replied: "رد الدعم",
    customer_replied: "رد العميل",
    internal_note_added: "ملاحظة داخلية",
    bug_archived: "أرشفة التقرير",
  },
  en: {},
};

function boardText(locale?: string | null) {
  return ADMIN_BOARD_LABELS[normalizeBugReportLocale(locale)];
}

function displayLabel(value: string | null | undefined, locale?: string | null) {
  if (!value) return cleanLabel(value);
  const normalized = normalizeBugReportLocale(locale);
  return VALUE_LABELS[normalized]?.[value] ?? cleanLabel(value);
}

function columnLabel(column: BugReportBoardColumn, locale?: string | null) {
  const normalized = normalizeBugReportLocale(locale);
  return (
    column.labelTranslations?.[normalized]?.trim() ||
    column.labelTranslations?.[`${normalized}-IR`]?.trim() ||
    column.labelTranslations?.en?.trim() ||
    displayLabel(column.title || column.key, locale)
  );
}


function statusTone(status: string) {
  switch (status) {
    case "resolved":
    case "closed":
    case "duplicate":
    case "wont_fix":
    case "done":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "need_info":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "in_progress":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "triaged":
      return "bg-violet-50 text-violet-700 border-violet-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100";
  }
}

function severityTone(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-600 text-white";
    case "high":
      return "bg-red-50 text-red-700";
    case "medium":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDate(value: string | null, locale?: string | null) {
  if (!value) return "-";
  const normalized = normalizeBugReportLocale(locale);
  const intlLocale = normalized === "fa" ? "fa-IR" : normalized === "ar" ? "ar" : "en";
  try {
    return new Intl.DateTimeFormat(intlLocale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

function isRecent(value: string | null, hours = 24) {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return false;
  return Date.now() - time <= hours * 60 * 60 * 1000;
}

function cleanLabel(value: string | null | undefined) {
  return value ? value.replace(/_/g, " ") : "update";
}


function describeRecentChange(change: BugReportRecentChange, locale?: string | null) {
  const normalized = normalizeBugReportLocale(locale);
  const event = displayLabel(change.eventType, locale);
  const fromValue = displayLabel(change.fromValue, locale);
  const toValue = displayLabel(change.toValue, locale);

  if (normalized === "fa") {
    switch (change.eventType) {
      case "status_changed":
        return change.fromValue && change.toValue
          ? `وضعیت را از ${fromValue} به ${toValue} تغییر داد`
          : `وضعیت را به ${toValue} تغییر داد`;
      case "assignee_changed":
        return change.toValue ? `مسئول را به ${toValue} تغییر داد` : "مسئول را حذف کرد";
      case "priority_changed":
        return change.fromValue && change.toValue
          ? `اولویت را از ${fromValue} به ${toValue} تغییر داد`
          : `اولویت را به ${toValue} تغییر داد`;
      case "agent_replied":
        return "پاسخ پشتیبانی اضافه کرد";
      case "customer_replied":
        return "پاسخ مشتری دریافت شد";
      case "internal_note_added":
        return "یادداشت داخلی اضافه کرد";
      case "bug_archived":
        return "این گزارش را آرشیو کرد";
      default:
        return event;
    }
  }

  if (normalized === "ar") {
    switch (change.eventType) {
      case "status_changed":
        return change.fromValue && change.toValue
          ? `غيّر الحالة من ${fromValue} إلى ${toValue}`
          : `غيّر الحالة إلى ${toValue}`;
      case "assignee_changed":
        return change.toValue ? `غيّر المسؤول إلى ${toValue}` : "أزال المسؤول";
      case "priority_changed":
        return change.fromValue && change.toValue
          ? `غيّر الأولوية من ${fromValue} إلى ${toValue}`
          : `غيّر الأولوية إلى ${toValue}`;
      case "agent_replied":
        return "أضاف رد دعم";
      case "customer_replied":
        return "تم استلام رد من العميل";
      case "internal_note_added":
        return "أضاف ملاحظة داخلية";
      case "bug_archived":
        return "أرشف هذا التقرير";
      default:
        return event;
    }
  }

  switch (change.eventType) {
    case "status_changed":
      return change.fromValue && change.toValue
        ? `changed status from ${fromValue} to ${toValue}`
        : `changed status to ${toValue}`;
    case "assignee_changed":
      return change.toValue ? `changed assignment to ${toValue}` : "removed assignment";
    case "priority_changed":
      return change.fromValue && change.toValue
        ? `changed priority from ${fromValue} to ${toValue}`
        : `changed priority to ${toValue}`;
    case "agent_replied":
      return "added a support reply";
    case "customer_replied":
      return "received a customer reply";
    case "internal_note_added":
      return "added an internal note";
    case "bug_archived":
      return "archived this report";
    default:
      return event;
  }
}

function RecentChangesPanel({ changes, locale }: { changes: BugReportRecentChange[]; locale: string }) {
  const ui = boardText(locale);
  return (
    <section className="rounded-[28px] border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-sm font-black text-amber-900">
          <History className="h-4 w-4" /> {ui.last7Changes}
        </div>
        <span className="text-xs font-semibold text-amber-700">{ui.liveContext}</span>
      </div>
      {changes.length === 0 ? (
        <p className="text-sm text-amber-800/80">{ui.noRecentChanges}</p>
      ) : (
        <div className="grid gap-2">
          {changes.map((change) => (
            <Link
              key={change.id}
              href={`/admin/bug-reports/${change.bugReportId}`}
              className="rounded-2xl border border-amber-100 bg-white/80 px-3 py-2 text-sm text-slate-700 transition hover:border-amber-300 hover:bg-white"
            >
              <span className="font-bold text-slate-950">{formatDate(change.createDate, locale)}</span>
              <span> · </span>
              <span className="font-semibold text-amber-800">{change.actorName}</span>
              <span> {describeRecentChange(change, locale)} {ui.changedIn} </span>
              <span className="font-bold text-emerald-700">{change.reportNumber}</span>
              <span>: </span>
              <span className="font-semibold text-slate-900">{change.title}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function pageHref(filters: AdminBugReportFilters, patch: Partial<AdminBugReportFilters>) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.status !== "all") params.set("status", next.status);
  if (next.severity !== "all") params.set("severity", next.severity);
  if (next.priority !== "all") params.set("priority", next.priority);
  if (next.area !== "all") params.set("area", next.area);
  if (next.ownership !== "all") params.set("ownership", next.ownership);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== 40) params.set("pageSize", String(next.pageSize));
  if (next.view !== "board") params.set("view", next.view);

  const query = params.toString();
  return query ? `/admin/bug-reports?${query}` : "/admin/bug-reports";
}

function BugCard({ item, locale, agents }: { item: BugReportCard; locale: string; agents: BugReportAssignableAgent[] }) {
  const ui = boardText(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const updatedRecentlyByOther = isRecent(item.updatedByOtherAt, 24);

  const runAction = (action: () => Promise<unknown>) => {
    startTransition(async () => {
      const result = await action();
      if (result && typeof result === "object" && "ok" in result && (result as { ok: boolean }).ok === false) {
        window.alert((result as { message?: string }).message || "Could not update bug report.");
      }
      router.refresh();
    });
  };

  const updateStatus = (status: BugReportStatus) => {
    const formData = new FormData();
    formData.set("bugReportId", item.id);
    formData.set("status", status);
    formData.set("path", "/admin/bug-reports");
    runAction(() => updateBugReportStatusAction(formData));
  };

  const updatePriority = (priority: BugReportPriority) => {
    const formData = new FormData();
    formData.set("bugReportId", item.id);
    formData.set("priority", priority);
    formData.set("path", "/admin/bug-reports");
    runAction(() => updateBugReportPriorityAction(formData));
  };

  const assignTo = (assignedToUserId: string) => {
    const formData = new FormData();
    formData.set("bugReportId", item.id);
    formData.set("assignedToUserId", assignedToUserId);
    formData.set("path", "/admin/bug-reports");
    runAction(() => assignBugReportAction(formData));
  };

  return (
    <article className={`rounded-3xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${updatedRecentlyByOther ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200"}`}>
      <Link href={`/admin/bug-reports/${item.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
              <span className="text-emerald-700">{item.reportNumber}</span>
              <span className={`rounded-full px-2 py-0.5 ${severityTone(item.severity)}`}>{displayLabel(item.severity, locale)}</span>
              {updatedRecentlyByOther ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">{ui.updatedBadge}</span> : null}
            </div>
            <h3 className="mt-1 line-clamp-2 text-sm font-bold text-slate-950">{item.title}</h3>
          </div>
          {item.unreadForAdminCount > 0 ? (
            <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{item.unreadForAdminCount}</span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-600">
          <span className={`rounded-full border px-2 py-1 ${statusTone(item.status)}`}>{displayLabel(item.status, locale)}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{displayLabel(item.priority, locale)}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{item.assignedToDisplayName || ui.unassigned}</span>
        </div>

        {updatedRecentlyByOther ? (
          <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">
            {displayLabel(item.updatedByOtherEventType, locale)} · {item.updatedByOtherBy || ui.anotherUser} · {formatDate(item.updatedByOtherAt, locale)}
          </div>
        ) : null}
      </Link>

      <details className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
        <summary className="cursor-pointer text-[11px] font-black uppercase tracking-wide text-slate-500">{ui.quickControls}</summary>
        <div className="mt-3 grid gap-2">
          {item.lastMessagePreview ? <p className="line-clamp-2 text-xs text-slate-500">{item.lastMessagePreview}</p> : null}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {item.messageCount}</span>
            <span className="inline-flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" /> {item.mediaCount}</span>
            <span>{formatDate(item.lastMessageAt || item.lastModifiedDate || item.createDate, locale)}</span>
          </div>
          <select
            aria-label={ui.status}
            disabled={isPending}
            value={item.status}
            onChange={(event) => updateStatus(event.target.value as BugReportStatus)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-600"
          >
            {BUG_REPORT_STATUSES.map((status) => (
              <option key={status} value={status}>{displayLabel(status, locale)}</option>
            ))}
          </select>
          <select
            aria-label="Priority"
            disabled={isPending}
            value={item.priority}
            onChange={(event) => updatePriority(event.target.value as BugReportPriority)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-600"
          >
            {BUG_REPORT_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>{displayLabel(priority, locale)}</option>
            ))}
          </select>
          <select
            aria-label={ui.assignTo}
            disabled={isPending}
            value={item.assignedToUserId || ""}
            onChange={(event) => assignTo(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-600"
          >
            <option value="">{ui.unassigned}</option>
            {agents.map((agent) => (
              <option key={agent.userId} value={agent.userId}>
                {agent.displayName}{agent.status ? ` (${agent.status})` : ""}
              </option>
            ))}
          </select>
          <Link href={`/admin/bug-reports/${item.id}`} className="rounded-xl bg-white px-3 py-2 text-center text-xs font-bold text-emerald-700 ring-1 ring-slate-200 hover:ring-emerald-300">
            {ui.openCard}
          </Link>
        </div>
      </details>
    </article>
  );
}

function ColumnSettingsPanel({ columns, locale }: { columns: BugReportBoardColumn[]; locale: string }) {
  const ui = boardText(locale);
  const normalized = normalizeBugReportLocale(locale);
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function saveColumnNames(formData: FormData) {
    setMessage(null);
    startSaving(async () => {
      const result = await updateBugReportBoardColumnsAction(formData);
      setMessage({ ok: result.ok, text: result.message || (result.ok ? ui.saveColumnNames : "Could not save column names.") });
      if (result.ok) router.refresh();
    });
  }

  return (
    <details className="rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <summary className="cursor-pointer text-sm font-black text-slate-700">{ui.columnSettings}</summary>
      <form action={saveColumnNames} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input type="hidden" name="locale" value={normalized} />
        <input type="hidden" name="path" value="/admin/bug-reports" />
        {columns.map((column) => (
          <label key={column.key} className="grid gap-1 text-xs font-bold text-slate-500">
            <span>{displayLabel(column.title || column.key, locale)}</span>
            <input
              name={`columnLabel:${column.key}`}
              defaultValue={columnLabel(column, locale)}
              disabled={isSaving}
              className="h-10 rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-600 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </label>
        ))}
        <button
          type="submit"
          disabled={isSaving}
          className="h-10 self-end rounded-2xl bg-[#083f30] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "..." : ui.saveColumnNames}
        </button>
        {message ? (
          <div className={`md:col-span-2 xl:col-span-5 rounded-2xl px-3 py-2 text-xs font-bold ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </div>
        ) : null}
      </form>
    </details>
  );
}

function BugList({ items, locale }: { items: BugReportCard[]; locale: string }) {
  const ui = boardText(locale);
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">{ui.report}</th>
              <th className="px-4 py-3">{ui.status}</th>
              <th className="px-4 py-3">{ui.reporter}</th>
              <th className="px-4 py-3">{ui.owner}</th>
              <th className="px-4 py-3">{ui.activity}</th>
              <th className="px-4 py-3">{ui.updatedByOther}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">{ui.noMatchingReports}</td></tr>
            ) : items.map((item) => {
              const updatedRecentlyByOther = isRecent(item.updatedByOtherAt, 24);
              return (
                <tr key={item.id} className={updatedRecentlyByOther ? "bg-amber-50/50" : "bg-white"}>
                  <td className="max-w-[420px] px-4 py-3">
                    <Link href={`/admin/bug-reports/${item.id}`} className="font-bold text-slate-950 hover:text-emerald-700">{item.title}</Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-bold text-emerald-700">{item.reportNumber}</span>
                      <span>{displayLabel(item.sourceArea, locale)}</span>
                      {item.unreadForAdminCount > 0 ? <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">{item.unreadForAdminCount} {ui.unread}</span> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusTone(item.status)}`}>{displayLabel(item.status, locale)}</span>
                    <div className="mt-2 flex gap-1 text-[11px] font-semibold">
                      <span className={`rounded-full px-2 py-0.5 ${severityTone(item.severity)}`}>{displayLabel(item.severity, locale)}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{displayLabel(item.priority, locale)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.customerDisplayName || item.guestName || item.guestEmail || ui.unknown}</td>
                  <td className="px-4 py-3 text-slate-700">{item.assignedToDisplayName || ui.unassigned}</td>
                  <td className="px-4 py-3 text-slate-500">
                    <div>{formatDate(item.lastMessageAt || item.lastModifiedDate || item.createDate, locale)}</div>
                    <div className="mt-1 text-xs">{item.messageCount} {ui.messages} · {item.mediaCount} {ui.files}</div>
                  </td>
                  <td className="px-4 py-3">
                    {item.updatedByOtherAt ? (
                      <div className={updatedRecentlyByOther ? "font-bold text-amber-700" : "text-slate-600"}>
                        {displayLabel(item.updatedByOtherEventType, locale)}
                        <div className="text-xs font-medium text-slate-500">{item.updatedByOtherBy || ui.anotherUser} · {formatDate(item.updatedByOtherAt, locale)}</div>
                      </div>
                    ) : <span className="text-slate-400">-</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminBugReportsBoard({ locale, items, stats, filters, pageInfo, recentChanges, agents, boardColumns }: Props) {
  const bugLocale = normalizeBugReportLocale(locale);
  const copy = BUG_REPORT_COPY[bugLocale];
  const ui = ADMIN_BOARD_LABELS[bugLocale];
  const router = useRouter();
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const safeItems = Array.isArray(items) ? items : [];
  const mergedStats = { ...EMPTY_STATS, ...(stats ?? {}) };
  const safeStats: BoardStats = {
    total: Number(mergedStats.total || 0),
    active: Number(mergedStats.active || 0),
    needInfo: Number(mergedStats.needInfo || 0),
    resolved: Number(mergedStats.resolved || 0),
    critical: Number(mergedStats.critical || 0),
    unassigned: Number(mergedStats.unassigned || 0),
  };
  const safeAgents = Array.isArray(agents) ? agents : [];
  const safeBoardColumns = Array.isArray(boardColumns) && boardColumns.length > 0 ? boardColumns : DEFAULT_BOARD_COLUMNS;
  const safeRecentChanges = Array.isArray(recentChanges) ? recentChanges : [];
  const page = Math.max(1, Number(pageInfo?.page ?? filters.page ?? 1));
  const pageSize = Math.min(100, Math.max(10, Number(pageInfo?.pageSize ?? filters.pageSize ?? 40)));
  const totalItems = Math.max(0, Number(pageInfo?.totalItems ?? safeItems.length));
  const totalPages = Math.max(1, Number(pageInfo?.totalPages ?? (Math.ceil(totalItems / pageSize) || 1)));
  const safePageInfo: AdminBugReportPageInfo = {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasPreviousPage: Boolean(pageInfo?.hasPreviousPage ?? page > 1),
    hasNextPage: Boolean(pageInfo?.hasNextPage ?? page < totalPages),
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
      setLastRefreshedAt(new Date());
    }, 45000);

    return () => window.clearInterval(interval);
  }, [router]);

  const grouped = useMemo(() => {
    return safeBoardColumns
      .filter((column) => column.isEnabled !== false && column.statuses.length > 0)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((column) => ({
        ...column,
        items: safeItems.filter((item) => column.statuses.includes(item.status)),
      }));
  }, [safeBoardColumns, safeItems]);

  const firstItemNumber = safePageInfo.totalItems === 0 ? 0 : (safePageInfo.page - 1) * safePageInfo.pageSize + 1;
  const lastItemNumber = Math.min(safePageInfo.totalItems, safePageInfo.page * safePageInfo.pageSize);

  return (
    <main dir={bugLocale === "en" ? "ltr" : "rtl"} className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="flex flex-col gap-4 rounded-[32px] bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <Bug className="h-4 w-4" /> {ui.qaBoard}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">{copy.adminTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">{copy.adminSubtitle}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1"><RefreshCw className="h-3.5 w-3.5" /> {ui.autoRefresh}</span>
              {lastRefreshedAt ? <span>{ui.lastRefresh} {formatDate(lastRefreshedAt.toISOString(), locale)}</span> : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Stat icon={<Inbox className="h-4 w-4" />} label={ui.total} value={safeStats.total} />
            <Stat icon={<Clock3 className="h-4 w-4" />} label={ui.active} value={safeStats.active} />
            <Stat icon={<AlertTriangle className="h-4 w-4" />} label={ui.needInfo} value={safeStats.needInfo} />
            <Stat icon={<CheckCircle2 className="h-4 w-4" />} label={ui.resolved} value={safeStats.resolved} />
            <Stat icon={<AlertTriangle className="h-4 w-4" />} label={ui.critical} value={safeStats.critical} />
            <Stat icon={<UserRound className="h-4 w-4" />} label={ui.unassignedStat} value={safeStats.unassigned} />
          </div>
        </div>

        <form className="grid gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1fr_145px_145px_145px_145px_145px_110px_110px_auto]" method="get">
          <input type="hidden" name="page" value="1" />
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={filters.q} placeholder={ui.searchPlaceholder} className="h-11 w-full rounded-2xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-600" />
          </label>
          <Select name="status" defaultValue={filters.status} values={["all", ...BUG_REPORT_STATUSES]} locale={locale} />
          <Select name="severity" defaultValue={filters.severity} values={["all", ...BUG_REPORT_SEVERITIES]} locale={locale} />
          <Select name="priority" defaultValue={filters.priority} values={["all", ...BUG_REPORT_PRIORITIES]} locale={locale} />
          <Select name="area" defaultValue={filters.area} values={["all", ...BUG_REPORT_AREAS]} locale={locale} />
          <Select name="ownership" defaultValue={filters.ownership ?? "all"} values={["all", "assigned_to_me", "unassigned"]} locale={locale} />
          <Select name="pageSize" defaultValue={String(filters.pageSize)} values={["20", "40", "60", "100"]} locale={locale} />
          <Select name="view" defaultValue={filters.view} values={["board", "list"]} locale={locale} />
          <button className="h-11 rounded-2xl bg-[#083f30] px-5 text-sm font-bold text-white">{ui.filter}</button>
        </form>

        <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            {ui.showingPrefix} <span className="font-bold text-slate-950">{firstItemNumber}-{lastItemNumber}</span> {ui.showingOf} <span className="font-bold text-slate-950">{safePageInfo.totalItems}</span> {ui.showingSuffix}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={pageHref(filters, { view: "board", page: 1 })} className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold ${filters.view === "board" ? "bg-[#083f30] text-white" : "bg-slate-100 text-slate-700"}`}>
              <LayoutGrid className="h-3.5 w-3.5" /> {ui.board}
            </Link>
            <Link href={pageHref(filters, { view: "list", page: 1 })} className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold ${filters.view === "list" ? "bg-[#083f30] text-white" : "bg-slate-100 text-slate-700"}`}>
              <List className="h-3.5 w-3.5" /> {ui.list}
            </Link>
            <Pagination filters={filters} pageInfo={safePageInfo} locale={locale} />
          </div>
        </div>

        <ColumnSettingsPanel columns={safeBoardColumns} locale={locale} />

        <RecentChangesPanel changes={safeRecentChanges} locale={locale} />

        {filters.view === "list" ? (
          <BugList items={safeItems} locale={locale} />
        ) : (
          <div className="grid gap-4 xl:grid-cols-5">
            {grouped.map((column) => (
              <section key={column.key} className="min-h-[420px] rounded-[28px] border border-slate-200 bg-slate-100/70 p-3">
                <div className={`mb-3 flex items-center justify-between rounded-2xl border px-3 py-2 text-sm font-bold ${statusTone(column.key)}`}>
                  <span>{columnLabel(column, locale)}</span>
                  <span>{column.items.length}</span>
                </div>
                <div className="space-y-3">
                  {column.items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500">{ui.noReports}</div>
                  ) : (
                    column.items.map((item) => <BugCard key={item.id} item={item} locale={locale} agents={safeAgents} />)
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Pagination({ filters, pageInfo, locale }: { filters: AdminBugReportFilters; pageInfo: AdminBugReportPageInfo; locale: string }) {
  const ui = boardText(locale);
  return (
    <div className="inline-flex items-center gap-2">
      <Link
        aria-disabled={!pageInfo.hasPreviousPage}
        href={pageInfo.hasPreviousPage ? pageHref(filters, { page: pageInfo.page - 1 }) : pageHref(filters, { page: pageInfo.page })}
        className={`inline-flex items-center gap-1 rounded-2xl px-3 py-2 text-xs font-bold ${pageInfo.hasPreviousPage ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "pointer-events-none bg-slate-50 text-slate-300"}`}
      >
        <ChevronLeft className="h-3.5 w-3.5" /> {ui.previous}
      </Link>
      <span className="px-2 text-xs font-bold text-slate-500">{ui.page} {pageInfo.page} / {pageInfo.totalPages}</span>
      <Link
        aria-disabled={!pageInfo.hasNextPage}
        href={pageInfo.hasNextPage ? pageHref(filters, { page: pageInfo.page + 1 }) : pageHref(filters, { page: pageInfo.page })}
        className={`inline-flex items-center gap-1 rounded-2xl px-3 py-2 text-xs font-bold ${pageInfo.hasNextPage ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "pointer-events-none bg-slate-50 text-slate-300"}`}
      >
        {ui.next} <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">{icon}{label}</div>
      <div className="mt-1 text-2xl font-black text-slate-950">{value}</div>
    </div>
  );
}

function Select({ name, defaultValue, values, locale }: { name: string; defaultValue: string; values: readonly string[]; locale: string }) {
  return (
    <select name={name} defaultValue={defaultValue} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600">
      {values.map((value) => (
        <option key={value} value={value}>{displayLabel(value, locale)}</option>
      ))}
    </select>
  );
}
