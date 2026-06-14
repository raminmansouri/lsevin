export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-pulse">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="px-5 pt-3 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-6 w-40 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-48 bg-gray-100 rounded" />
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-200" />
          </div>

          <div className="h-11 bg-gray-100 rounded-xl mb-3" />

          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-10 w-24 rounded-xl bg-gray-100 flex-none" />
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-2">
        <div className="h-40 rounded-2xl bg-gray-200" />
      </div>

      <div className="px-5 py-4 space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            <div className="h-48 bg-gray-200" />
            <div className="p-4">
              <div className="h-5 w-2/3 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-100 rounded mb-3" />
              <div className="h-6 w-44 bg-gray-200 rounded mb-3" />
              <div className="h-10 w-full bg-gray-100 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
