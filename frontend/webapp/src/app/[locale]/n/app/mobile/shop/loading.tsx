export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse bg-gray-50 px-5 py-6">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-72 rounded bg-gray-100" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="aspect-square bg-gray-200" />
            <div className="space-y-2 p-4"><div className="h-4 w-20 rounded bg-gray-100" /><div className="h-5 w-32 rounded bg-gray-200" /><div className="h-4 w-full rounded bg-gray-100" /><div className="h-5 w-24 rounded bg-gray-200" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
