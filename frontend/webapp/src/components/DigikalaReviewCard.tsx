"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  MessageCircle,
  MinusCircle,
  PlusCircle,
  Send,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { env } from "@/config/env/client";

export type ReviewVoteValue = "like" | "dislike";
export type DigikalaReviewReply = {
  id: string | number;
  name: string;
  role?: "admin" | "customer" | string | null;
  reply: string;
  date?: string | null;
  verified?: boolean | null;
  createdByAdmin?: boolean | null;
};
export type DigikalaReview = {
  id: string | number;
  name: string;
  country?: string | null;
  date?: string | null;
  rating: number;
  treatment?: string | null;
  review: string;
  verified?: boolean | null;
  helpful?: number | null;
  notHelpful?: number | null;
  images?: string[] | null;
  pros?: string[] | null;
  cons?: string[] | null;
  replies?: DigikalaReviewReply[] | null;
  createdByAdmin?: boolean | null;
  providerName?: string | null;
};

interface DigikalaReviewCardProps {
  review: DigikalaReview;
  locale?: string | null;
  providerId?: string | null;
  className?: string;
}


function mediaUrl(value?: string | null): string {
  const raw = String(value || "").trim();
  if (!raw) return "/placeholder-provider.svg";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) return raw;
  if (raw.startsWith("/placeholder-") || raw.startsWith("/_next/") || raw.startsWith("/favicon")) return raw;
  const base = env.NEXT_PUBLIC_FILES_URL?.replace(/\/+$/, "");
  const path = raw.replace(/^\/+/, "");
  return base ? `${base}/${path}` : `/${path}`;
}

function normalizeList(value?: string[] | null) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function normalizeReplies(value?: DigikalaReviewReply[] | null): DigikalaReviewReply[] {
  return Array.isArray(value)
    ? value
        .map((item) => ({
          ...item,
          id: item.id,
          name: String(item.name || "LSevin").trim(),
          reply: String(item.reply || "").trim(),
          role: item.role === "admin" ? "admin" : "customer",
        }))
        .filter((item) => item.id && item.reply)
    : [];
}

function formatNumber(value: number, locale?: string | null) {
  try {
    return new Intl.NumberFormat(locale || "en").format(value);
  } catch {
    return String(value);
  }
}

function voteStorageKey(providerId: string, reviewId: string | number) {
  return `lsevin:review-vote:${providerId}:${reviewId}`;
}

export function DigikalaReviewCard({
  review,
  locale,
  providerId,
  className,
}: DigikalaReviewCardProps) {
  const t = useTranslations("components.digikalaReviewCard");
  const [expanded, setExpanded] = useState(false);
  const [helpful, setHelpful] = useState(Number(review.helpful || 0));
  const [notHelpful, setNotHelpful] = useState(Number(review.notHelpful || 0));
  const [vote, setVote] = useState<ReviewVoteValue | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [replies, setReplies] = useState<DigikalaReviewReply[]>(() => normalizeReplies(review.replies));
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [replyMessage, setReplyMessage] = useState<string | null>(null);

  const pros = useMemo(() => normalizeList(review.pros), [review.pros]);
  const cons = useMemo(() => normalizeList(review.cons), [review.cons]);
  const images = useMemo(() => normalizeList(review.images), [review.images]);
  const reviewText = String(review.review || "").trim();
  const shouldCollapse = reviewText.length > 280;
  const displayText = shouldCollapse && !expanded ? `${reviewText.slice(0, 280).trim()}...` : reviewText;
  const reviewerInitial = String(review.name || "L").trim().charAt(0).toUpperCase() || "L";

  useEffect(() => {
    setReplies(normalizeReplies(review.replies));
  }, [review.replies]);

  useEffect(() => {
    if (!providerId || typeof window === "undefined") return;
    const stored = window.localStorage.getItem(voteStorageKey(providerId, review.id));
    if (stored === "like" || stored === "dislike") setVote(stored);
  }, [providerId, review.id]);

  const submitVote = async (nextVote: ReviewVoteValue) => {
    if (!providerId || isVoting) return;
    setIsVoting(true);
    try {
      const response = await fetch(`/api/service-providers/${providerId}/reviews/${review.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: nextVote }),
      });
      if (!response.ok) throw new Error(t("voteError"));
      const payload = await response.json();
      setHelpful(Number(payload.helpfulCount || 0));
      setNotHelpful(Number(payload.notHelpfulCount || 0));
      setVote(nextVote);
      window.localStorage.setItem(voteStorageKey(providerId, review.id), nextVote);
    } catch {
      // Helpful votes are non-critical UI feedback. Keep the card usable if saving fails.
    } finally {
      setIsVoting(false);
    }
  };

  const submitReply = async () => {
    if (!providerId || replyStatus === "submitting") return;
    const text = replyText.trim();
    if (text.length < 2) return;
    setReplyStatus("submitting");
    setReplyMessage(null);
    try {
      const response = await fetch(`/api/service-providers/${providerId}/reviews/${review.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: text }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.title || payload?.detail || t("replyError"));
      if (payload?.reply) setReplies((current) => [...current, payload.reply]);
      setReplyText("");
      setShowReplyForm(false);
      setReplyStatus("success");
      setReplyMessage(t("pendingReply"));
    } catch (error) {
      setReplyStatus("error");
      setReplyMessage(error instanceof Error ? error.message : t("replyError"));
    }
  };

  return (
    <article className={`rounded-2xl border border-gray-200 bg-white p-4 ${className || ""}`}>
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700">
          {reviewerInitial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-gray-900">{review.name || t("lsevinCustomer")}</h4>
            {review.verified ? <BadgeCheck size={16} className="text-[#083f30]" /> : null}
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
              {review.createdByAdmin ? t("adminReview") : t("verifiedBuyer")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {review.country ? <span>{review.country}</span> : null}
            {review.country && review.date ? <span>•</span> : null}
            {review.date ? <span>{review.date}</span> : null}
            {review.providerName ? (
              <>
                <span>•</span>
                <span>{review.providerName}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: Math.max(0, Math.min(5, Math.round(Number(review.rating || 0)))) }).map((_, index) => (
            <Star key={index} size={14} className="fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      </div>

      {review.treatment ? (
        <span className="mb-3 inline-block rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
          {review.treatment}
        </span>
      ) : null}

      {pros.length > 0 || cons.length > 0 ? (
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {pros.length > 0 ? (
            <div className="rounded-xl bg-emerald-50 p-3">
              <div className="mb-2 flex items-center gap-1 text-xs font-bold text-emerald-700">
                <PlusCircle size={14} /> {t("pros")}
              </div>
              <ul className="space-y-1 text-xs text-emerald-800">
                {pros.map((item) => (
                  <li key={item}>+ {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {cons.length > 0 ? (
            <div className="rounded-xl bg-rose-50 p-3">
              <div className="mb-2 flex items-center gap-1 text-xs font-bold text-rose-700">
                <MinusCircle size={14} /> {t("cons")}
              </div>
              <ul className="space-y-1 text-xs text-rose-800">
                {cons.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="mb-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{displayText}</p>
      {shouldCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mb-3 text-xs font-bold text-[#083f30] hover:underline"
        >
          {expanded ? t("showLess") : t("showMore")}
        </button>
      ) : null}

      {images.length ? (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <span key={`${review.id}-${image}-${index}`} className="relative block h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              <ImageWithFallback
                fill
                src={mediaUrl(image)}
                alt={t("reviewImageAlt")}
                sizes="80px"
                className="object-cover"
                fallbackClassName="h-full w-full"
              />
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <span className="text-xs font-medium text-gray-500">{t("helpfulPrompt")}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => submitVote("like")}
            disabled={!providerId || isVoting}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              vote === "like"
                ? "border-[#083f30] bg-[#083f30] text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-[#083f30] hover:text-[#083f30]"
            }`}
          >
            <ThumbsUp size={13} /> {t("like")} ({formatNumber(helpful, locale)})
          </button>
          <button
            type="button"
            onClick={() => submitVote("dislike")}
            disabled={!providerId || isVoting}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              vote === "dislike"
                ? "border-gray-700 bg-gray-700 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-500"
            }`}
          >
            <ThumbsDown size={13} /> {t("dislike")} ({formatNumber(notHelpful, locale)})
          </button>
        </div>
      </div>

      {replies.length ? (
        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <MessageCircle size={14} /> {t("replies")}
          </div>
          {replies.map((reply) => (
            <div key={reply.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{reply.name || "LSevin"}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                  {reply.role === "admin" || reply.createdByAdmin ? t("adminAnswer") : t("customerAnswer")}
                </span>
                {reply.verified ? <BadgeCheck size={14} className="text-[#083f30]" /> : null}
                {reply.date ? <span className="text-[11px] text-gray-500">{reply.date}</span> : null}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{reply.reply}</p>
            </div>
          ))}
        </div>
      ) : null}

      {replyMessage ? (
        <div className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium ${replyStatus === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {replyMessage}
        </div>
      ) : null}

      {providerId ? (
        <div className="mt-3 border-t border-gray-100 pt-3">
          {showReplyForm ? (
            <div className="space-y-2">
              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder={t("replyPlaceholder")}
                maxLength={1000}
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#083f30]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyText("");
                  }}
                  className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  {t("showLess")}
                </button>
                <button
                  type="button"
                  onClick={submitReply}
                  disabled={replyStatus === "submitting" || replyText.trim().length < 2}
                  className="inline-flex items-center gap-1 rounded-full bg-[#083f30] px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <Send size={13} /> {t("submitReply")}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowReplyForm(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#083f30] hover:underline"
            >
              <MessageCircle size={14} /> {t("writeReply")}
            </button>
          )}
        </div>
      ) : null}
    </article>
  );
}
