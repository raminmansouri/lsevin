
export default function Loading() {
  return (
    <div className="min-h-screen bg-white pb-24 animate-pulse">
      <div className="bg-white px-5 pt-3 pb-4 border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-8 w-28 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-44 bg-gray-100 rounded" />
          </div>
          <div className="w-11 h-11 bg-gray-200 rounded-full" />
        </div>

        <div className="flex gap-2">
          <div className="flex-1 h-12 bg-gray-100 rounded-xl" />
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        </div>

        <div className="flex gap-2 mt-3 overflow-hidden">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-9 w-24 bg-gray-100 rounded-full flex-none" />
          ))}
        </div>
      </div>

      <div className="py-6 px-5">
        <div className="h-7 w-52 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-64 bg-gray-100 rounded mb-4" />

        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl bg-gray-200 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-5 w-2/3 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-gray-100 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-gray-100 rounded mb-3" />
                  <div className="flex gap-2 mb-3">
                    <div className="h-6 w-20 bg-gray-100 rounded-md" />
                    <div className="h-6 w-16 bg-gray-100 rounded-md" />
                  </div>
                  <div className="h-4 w-28 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="h-40 rounded-2xl bg-gray-200" />
      </div>

      <div className="py-6 px-5">
        <div className="h-7 w-44 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-36 bg-gray-100 rounded mb-4" />

        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex-none w-64 bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="aspect-[16/10] bg-gray-200" />
              <div className="p-4">
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-1/2 bg-gray-100 rounded mb-3" />
                <div className="h-4 w-2/3 bg-gray-100 rounded mb-3" />
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                  <div className="h-5 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}