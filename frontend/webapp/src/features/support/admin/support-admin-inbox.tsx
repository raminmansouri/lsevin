"use client";

import { CheckCircle2, Clock3, Headphones, Loader2, MessageSquareText, NotebookPen, Plus, Search, SendHorizonal, Tag, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addInternalNoteAction,
  addTagToConversationAction,
  assignConversationAction,
  getAdminConversationDetailAction,
  listAdminConversationsAction,
  markConversationReadForAdminAction,
  removeTagFromConversationAction,
  sendAgentMessageAction,
  updateConversationPriorityAction,
  updateConversationStatusAction,
  upsertAgentPresenceAction,
} from "../server/actions";
import type { SupportCannedReply, SupportConversationDetail, SupportConversationListItem, SupportConversationListResult, SupportPriority, SupportStatus, SupportTag } from "../types";
import { SupportThread } from "../components/support-thread";
import { formatSupportTime, getInitials } from "../components/support-ui-utils";

type Props = {
  initialConversations: SupportConversationListResult;
  initialSelectedConversation?: SupportConversationDetail | null;
  tags: SupportTag[];
  cannedReplies: SupportCannedReply[];
};

const statuses: Array<SupportStatus | "all" | "unassigned" | "assigned_to_me"> = ["all", "open", "pending", "resolved", "closed", "unassigned", "assigned_to_me"];
const priorities: Array<SupportPriority | "all"> = ["all", "low", "normal", "high", "urgent"];

export function SupportAdminInbox({ initialConversations, initialSelectedConversation, tags, cannedReplies }: Props) {
  const { data: session } = useSession();
  const user = session?.user;
  const [list, setList] = useState(initialConversations);
  const [selected, setSelected] = useState<SupportConversationDetail | null>(initialSelectedConversation || null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("open");
  const [priority, setPriority] = useState<(typeof priorities)[number]>("all");
  const [tagId, setTagId] = useState("");
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!user?.id) return;
    upsertAgentPresenceAction({ userId: user.id, status: "online", displayName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email }).catch(() => undefined);
  }, [user?.id, user?.email, user?.firstName, user?.lastName]);

  useEffect(() => {
    if (!selected?.id) return;
    markConversationReadForAdminAction(selected.id).catch(() => undefined);
  }, [selected?.id]);

  useEffect(() => {
    const interval = window.setInterval(() => refreshList(false), 8000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, priority, tagId, user?.id, selected?.id]);

  const selectedTagIds = useMemo(() => new Set(selected?.tags.map((tag) => tag.id) || []), [selected?.tags]);

  const refreshList = (showToast = true) => {
    startTransition(async () => {
      const result = await listAdminConversationsAction({ search, status, priority, tagId: tagId || undefined, assignedToUserId: user?.id, pageNumber: 1, pageSize: 30 });
      if (result.data) setList(result.data);
      if (result.error && showToast) toast.error(result.error.detail || result.error.title);
      if (selected?.id) {
        const detail = await getAdminConversationDetailAction(selected.id);
        if (detail.data) setSelected(detail.data);
      }
    });
  };

  const openConversation = (item: SupportConversationListItem) => {
    startTransition(async () => {
      const result = await getAdminConversationDetailAction(item.id);
      if (result.data) setSelected(result.data);
      if (result.error) toast.error(result.error.detail || result.error.title);
    });
  };

  const sendReply = () => {
    if (!selected?.id || !reply.trim()) return;
    const body = reply.trim();
    setReply("");
    startTransition(async () => {
      const result = await sendAgentMessageAction({ conversationId: selected.id, agentUserId: user?.id, body, attachments: [] });
      if (result.error) toast.error(result.error.detail || result.error.title);
      const detail = await getAdminConversationDetailAction(selected.id);
      if (detail.data) setSelected(detail.data);
      refreshList(false);
    });
  };

  const addNote = () => {
    if (!selected?.id || !note.trim()) return;
    const body = note.trim();
    setNote("");
    startTransition(async () => {
      const result = await addInternalNoteAction({ conversationId: selected.id, agentUserId: user?.id, body });
      if (result.error) toast.error(result.error.detail || result.error.title);
      const detail = await getAdminConversationDetailAction(selected.id);
      if (detail.data) setSelected(detail.data);
    });
  };

  const updateStatus = (nextStatus: SupportStatus) => {
    if (!selected?.id) return;
    startTransition(async () => {
      const result = await updateConversationStatusAction({ conversationId: selected.id, status: nextStatus, actorUserId: user?.id });
      if (result.data) setSelected(result.data);
      if (result.error) toast.error(result.error.detail || result.error.title);
      refreshList(false);
    });
  };

  const updatePriority = (nextPriority: SupportPriority) => {
    if (!selected?.id) return;
    startTransition(async () => {
      const result = await updateConversationPriorityAction({ conversationId: selected.id, priority: nextPriority, actorUserId: user?.id });
      if (result.data) setSelected(result.data);
      if (result.error) toast.error(result.error.detail || result.error.title);
      refreshList(false);
    });
  };

  const assignToMe = () => {
    if (!selected?.id || !user?.id) return;
    startTransition(async () => {
      const result = await assignConversationAction({ conversationId: selected.id, assignedToUserId: user.id, actorUserId: user.id });
      if (result.data) setSelected(result.data);
      if (result.error) toast.error(result.error.detail || result.error.title);
      refreshList(false);
    });
  };

  const toggleTag = (tag: SupportTag) => {
    if (!selected?.id) return;
    startTransition(async () => {
      const action = selectedTagIds.has(tag.id) ? removeTagFromConversationAction : addTagToConversationAction;
      const result = await action({ conversationId: selected.id, tagId: tag.id, actorUserId: user?.id });
      if (result.data) setSelected(result.data);
      if (result.error) toast.error(result.error.detail || result.error.title);
      refreshList(false);
    });
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="grid h-[calc(100vh-7rem)] grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)_320px]">
        <aside className="border-r bg-slate-50/70">
          <div className="border-b bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">Support Inbox</h1>
                <p className="text-xs text-muted-foreground">Crisp-like conversations</p>
              </div>
              {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && refreshList()} placeholder="Search conversations" className="rounded-2xl pl-9" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select value={status} onChange={(event) => setStatus(event.target.value as any)} className="h-10 rounded-2xl border bg-white px-3 text-sm">
                {statuses.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
              </select>
              <select value={priority} onChange={(event) => setPriority(event.target.value as any)} className="h-10 rounded-2xl border bg-white px-3 text-sm">
                {priorities.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <select value={tagId} onChange={(event) => setTagId(event.target.value)} className="col-span-2 h-10 rounded-2xl border bg-white px-3 text-sm">
                <option value="">All tags</option>
                {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
              </select>
            </div>
          </div>

          <div className="h-[calc(100%-154px)] overflow-y-auto p-2">
            {list.items.length === 0 ? (
              <div className="m-3 rounded-3xl border border-dashed bg-white p-6 text-center text-sm text-muted-foreground">No conversations found.</div>
            ) : list.items.map((item) => (
              <button key={item.id} type="button" onClick={() => openConversation(item)} className={`mb-2 w-full rounded-3xl border p-3 text-left transition hover:bg-white ${selected?.id === item.id ? "border-[#083f30] bg-white shadow-sm" : "border-transparent bg-transparent"}`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">{getInitials(item.displayName)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{item.displayName}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{formatSupportTime(item.lastMessageAt || item.createDate)}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{item.lastMessagePreview || item.displayContact || item.conversationNumber}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <Badge variant="outline" className="rounded-full text-[10px]">{item.status}</Badge>
                      <Badge variant="secondary" className="rounded-full text-[10px]">{item.priority}</Badge>
                      {item.unreadForAdminCount > 0 && <Badge className="rounded-full bg-red-600 text-[10px]">{item.unreadForAdminCount}</Badge>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex min-h-0 flex-col bg-white">
          {selected ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#083f30] font-bold text-white">{getInitials(selected.displayName)}</div>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold">{selected.displayName}</h2>
                    <p className="truncate text-xs text-muted-foreground">{selected.conversationNumber} · {selected.displayContact || "No contact"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select value={selected.status} onChange={(event) => updateStatus(event.target.value as SupportStatus)} className="h-10 rounded-2xl border bg-white px-3 text-sm">
                    {statuses.filter((x) => !["all", "unassigned", "assigned_to_me"].includes(x)).map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <Button variant="outline" className="rounded-2xl" onClick={assignToMe}>Assign to me</Button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5">
                <SupportThread messages={selected.messages} customerSide={false} />
              </div>

              <div className="border-t bg-white p-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  {cannedReplies.map((item) => (
                    <Button key={item.id} type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setReply(item.bodyTranslations["en-US"] || Object.values(item.bodyTranslations)[0] || "")}>{item.shortcut || item.title}</Button>
                  ))}
                </div>
                <div className="flex items-end gap-2 rounded-3xl border bg-slate-50 p-2">
                  <Textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to customer..." className="min-h-[72px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0" />
                  <Button size="icon" onClick={sendReply} disabled={!reply.trim() || isPending} className="h-11 w-11 shrink-0 rounded-2xl"><SendHorizonal className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div>
                <MessageSquareText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Select a conversation</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose an item from the inbox to start replying.</p>
              </div>
            </div>
          )}
        </main>

        <aside className="hidden min-h-0 overflow-y-auto border-l bg-white p-4 lg:block">
          {selected ? (
            <div className="space-y-4">
              <Card className="rounded-3xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><UserRound className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{selected.displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{selected.displayContact || "No contact"}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-2xl bg-slate-50 p-3"><p className="text-muted-foreground">Source</p><p className="font-semibold">{selected.source}</p></div>
                    <div className="rounded-2xl bg-slate-50 p-3"><p className="text-muted-foreground">Locale</p><p className="font-semibold">{selected.locale || "-"}</p></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between"><h3 className="font-semibold">Priority</h3><Clock3 className="h-4 w-4 text-muted-foreground" /></div>
                  <select value={selected.priority} onChange={(event) => updatePriority(event.target.value as SupportPriority)} className="h-10 w-full rounded-2xl border bg-white px-3 text-sm">
                    {priorities.filter((x) => x !== "all").map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between"><h3 className="font-semibold">Tags</h3><Tag className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button key={tag.id} type="button" onClick={() => toggleTag(tag)} className={`rounded-full border px-3 py-1 text-xs ${selectedTagIds.has(tag.id) ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}>
                        {selectedTagIds.has(tag.id) ? "✓ " : "+ "}{tag.name}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between"><h3 className="font-semibold">Internal note</h3><NotebookPen className="h-4 w-4 text-muted-foreground" /></div>
                  <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Only admins can see this note..." className="min-h-[100px] rounded-2xl" />
                  <Button type="button" variant="outline" onClick={addNote} disabled={!note.trim() || isPending} className="w-full rounded-2xl"><Plus className="mr-2 h-4 w-4" />Add note</Button>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardContent className="space-y-2 p-4 text-sm">
                  <div className="flex items-center justify-between"><h3 className="font-semibold">Timeline</h3><CheckCircle2 className="h-4 w-4 text-muted-foreground" /></div>
                  {selected.events.length === 0 ? <p className="text-xs text-muted-foreground">No events yet.</p> : selected.events.slice(-8).reverse().map((event) => (
                    <div key={event.id} className="rounded-2xl bg-slate-50 p-3 text-xs">
                      <p className="font-semibold">{event.eventType.replaceAll("_", " ")}</p>
                      <p className="text-muted-foreground">{formatSupportTime(event.createDate)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground"><Headphones className="mr-2 h-4 w-4" />Customer context appears here.</div>
          )}
        </aside>
      </div>
    </div>
  );
}
