"use client";

import { useEffect } from "react";

/**
 * Segment error boundary for the Shop admin. Without it, any thrown error in a
 * server component here bubbles to the app-wide error screen and the whole page
 * reads as "not working" with no clue why. This keeps the admin shell and shows
 * the actual message + digest so the failure is diagnosable in place.
 */
export default function ShopAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin/shop] render error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-bold text-red-700">This shop admin page failed to load</h1>
        <p className="mt-2 text-sm text-gray-600">
          The rest of the admin panel is unaffected. Details below help pin down the cause
          (a missing migration and a stale session are the usual ones).
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
          {error.message || "Unknown error"}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
        <div className="mt-4 flex gap-2">
          <button
            onClick={reset}
            className="rounded-lg bg-[#083f30] px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
          <a
            href="/admin/shop"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
