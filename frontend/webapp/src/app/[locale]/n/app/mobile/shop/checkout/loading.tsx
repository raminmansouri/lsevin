export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse bg-neutral-50 px-4 py-4" aria-busy="true">
      <div className="h-6 w-28 rounded bg-neutral-200" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/[0.04]">
            <div className="h-20 w-20 shrink-0 rounded-xl bg-neutral-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded bg-neutral-100" />
              <div className="h-3 w-1/3 rounded bg-neutral-100" />
              <div className="h-4 w-24 rounded bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 h-32 rounded-2xl bg-white ring-1 ring-black/[0.04]" />
    </div>
  );
}
