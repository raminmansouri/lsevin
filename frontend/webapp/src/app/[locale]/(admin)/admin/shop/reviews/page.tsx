import Link from "next/link";

import { listQuestionsForModeration, listReviewsForModeration } from "@/features/shop/api/admin.repository";
import {
  answerQuestionForm,
  moderateReviewForm,
  setQuestionHiddenForm,
} from "@/features/shop/actions/admin-content.actions";

export const dynamic = "force-dynamic";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ reviews?: string; questions?: string }>;
}) {
  const sp = await searchParams;
  const [reviews, questions] = await Promise.all([
    listReviewsForModeration(sp.reviews || "pending"),
    listQuestionsForModeration(sp.questions || "open"),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reviews &amp; questions</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">← Dashboard</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="font-semibold">Reviews:</span>
            {["pending", "approved", "rejected", "all"].map((s) => (
              <Link key={s} href={`/admin/shop/reviews?reviews=${s}`} className={`rounded px-2 py-0.5 ${(sp.reviews || "pending") === s ? "bg-[#083f30] text-white" : "bg-white ring-1 ring-gray-200"}`}>{s}</Link>
            ))}
          </div>
          <div className="space-y-2">
            {reviews.map((r: any) => (
              <div key={r.id} className="rounded-xl border border-gray-100 bg-white p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-amber-500">{"★".repeat(r.rating)}<span className="ms-2 text-xs text-gray-500">{r.customer_name || "—"}</span></span>
                  <span className="text-xs text-gray-400">{r.status}{r.is_verified_purchase ? " · verified" : ""}</span>
                </div>
                <Link href={`/admin/shop/products`} className="text-xs text-[#083f30]">{r.product_name}</Link>
                {r.title ? <p className="mt-1 font-semibold">{r.title}</p> : null}
                {r.body ? <p className="text-gray-600">{r.body}</p> : null}
                {r.status === "pending" ? (
                  <div className="mt-2 flex gap-2">
                    <form action={moderateReviewForm}>
                      <input type="hidden" name="id" value={r.id} /><input type="hidden" name="decision" value="approved" />
                      <button className="rounded bg-green-700 px-3 py-1 text-xs font-semibold text-white">Approve</button>
                    </form>
                    <form action={moderateReviewForm}>
                      <input type="hidden" name="id" value={r.id} /><input type="hidden" name="decision" value="rejected" />
                      <button className="rounded bg-red-700 px-3 py-1 text-xs font-semibold text-white">Reject</button>
                    </form>
                  </div>
                ) : null}
              </div>
            ))}
            {!reviews.length ? <p className="rounded-xl bg-white p-6 text-center text-xs text-gray-400">Nothing here.</p> : null}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="font-semibold">Questions:</span>
            {["open", "answered", "hidden", "all"].map((s) => (
              <Link key={s} href={`/admin/shop/reviews?questions=${s}`} className={`rounded px-2 py-0.5 ${(sp.questions || "open") === s ? "bg-[#083f30] text-white" : "bg-white ring-1 ring-gray-200"}`}>{s}</Link>
            ))}
          </div>
          <div className="space-y-2">
            {questions.map((q: any) => (
              <div key={q.id} className="rounded-xl border border-gray-100 bg-white p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#083f30]">{q.product_name}</span>
                  <span className="text-xs text-gray-400">{q.status}</span>
                </div>
                <p className="mt-1 font-medium">{q.question}</p>
                {q.answer ? <p className="mt-1 text-gray-600">↳ {q.answer}</p> : null}
                <div className="mt-2 flex items-center gap-2">
                  <form action={answerQuestionForm} className="flex flex-1 gap-1">
                    <input type="hidden" name="id" value={q.id} />
                    <input name="answer" defaultValue={q.answer ?? ""} placeholder="Answer…" className={input} />
                    <button className="rounded bg-[#083f30] px-3 text-xs font-semibold text-white">Save</button>
                  </form>
                  <form action={setQuestionHiddenForm}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="hidden" value={q.status === "hidden" ? "false" : "true"} />
                    <button className="rounded border border-gray-300 px-2 py-1 text-xs">{q.status === "hidden" ? "Unhide" : "Hide"}</button>
                  </form>
                </div>
              </div>
            ))}
            {!questions.length ? <p className="rounded-xl bg-white p-6 text-center text-xs text-gray-400">Nothing here.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
