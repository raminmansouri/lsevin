"use client";

import { RefreshCwIcon } from "lucide-react";

export default function GlobalError({
  error,
  resetAction,
}: {
  error: Error & { digest?: string };
  resetAction: () => void;
}) {
  return (
    <html>
      <body>
        <h2>{error?.message}</h2>
        <button onClick={() => resetAction()}>
          <RefreshCwIcon />
        </button>
      </body>
    </html>
  );
}
