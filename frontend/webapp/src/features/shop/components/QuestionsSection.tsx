"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { submitQuestionAction } from "../actions/review.actions";

type QA = { id: string; question: string; answer: string | null; createDate: string };

export function QuestionsSection({
  productId,
  slug,
  questions,
  canAsk,
}: {
  productId: string;
  slug: string;
  questions: QA[];
  canAsk: boolean;
}) {
  const t = useTranslations("Shop");
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <section className="mt-2 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-neutral-900">{t("questions")}</h2>

      {questions.length ? (
        <div className="mb-4 space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="border-b border-neutral-100 pb-3 last:border-0">
              <p className="text-sm font-medium text-neutral-800">Q: {q.question}</p>
              {q.answer ? <p className="mt-0.5 text-sm text-neutral-600">A: {q.answer}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-xs text-neutral-500">{t("noQuestions")}</p>
      )}

      {canAsk ? (
        done ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{t("questionSubmitted")}</p>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setErr(null);
              const q = text.trim();
              if (q.length < 5) return;
              startTransition(async () => {
                try {
                  await submitQuestionAction({ productId, slug, question: q });
                  setDone(true);
                } catch (e2) {
                  setErr(e2 instanceof Error ? e2.message : t("somethingWrong"));
                }
              });
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("yourQuestion")}
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#083f30]"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-[#083f30] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {t("submitQuestion")}
            </button>
          </form>
        )
      ) : null}
      {err ? <p className="mt-1 text-xs text-amber-700">{err}</p> : null}
    </section>
  );
}
