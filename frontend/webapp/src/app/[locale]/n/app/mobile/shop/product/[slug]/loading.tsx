export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse bg-neutral-50 pb-24" aria-busy="true">
      <div className="aspect-square w-full bg-neutral-200" />
      <div className="space-y-3 bg-white p-4">
        <div className="h-3 w-24 rounded bg-neutral-100" />
        <div className="h-5 w-3/4 rounded bg-neutral-200" />
        <div className="h-6 w-32 rounded bg-neutral-200" />
        <div className="h-3 w-full rounded bg-neutral-100" />
        <div className="h-3 w-5/6 rounded bg-neutral-100" />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 bg-white p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-square w-full rounded-xl bg-neutral-100" />
            <div className="h-3 w-2/3 rounded bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
