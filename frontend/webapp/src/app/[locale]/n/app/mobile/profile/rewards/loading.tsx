export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-8 animate-pulse">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="h-6 w-40 rounded bg-gray-200" />
        </div>
        <div className="flex px-5 gap-4 pb-2">
          <div className="h-10 w-24 rounded bg-gray-100" />
          <div className="h-10 w-24 rounded bg-gray-100" />
          <div className="h-10 w-24 rounded bg-gray-100" />
        </div>
      </div>
      <div className="px-5 py-6 space-y-6">
        <div className="rounded-3xl h-56 bg-gray-200" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-24 rounded-2xl bg-white border border-gray-200" />
          <div className="h-24 rounded-2xl bg-white border border-gray-200" />
          <div className="h-24 rounded-2xl bg-white border border-gray-200" />
        </div>
        <div className="space-y-3">
          <div className="h-28 rounded-2xl bg-white border border-gray-200" />
          <div className="h-28 rounded-2xl bg-white border border-gray-200" />
          <div className="h-28 rounded-2xl bg-white border border-gray-200" />
        </div>
      </div>
    </div>
  );
}
