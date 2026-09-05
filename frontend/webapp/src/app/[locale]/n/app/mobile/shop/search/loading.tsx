export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse bg-neutral-50 px-4 py-4" aria-busy="true">
      <div className="h-5 w-40 rounded bg-neutral-200" />
      <div className="mt-3 flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 w-20 shrink-0 rounded-full bg-neutral-100" />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.04]">
            <div className="aspect-square w-full bg-neutral-100" />
            <div className="space-y-2 p-2.5">
              <div className="h-3 w-full rounded bg-neutral-100" />
              <div className="h-3 w-2/3 rounded bg-neutral-100" />
              <div className="h-4 w-1/3 rounded bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
