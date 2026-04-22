export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div>
              <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="h-4 w-24 bg-gray-100 rounded" />
        </div>
        <div className="px-6 pb-2">
          <div className="flex gap-2">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-9 w-24 bg-gray-100 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="p-6 space-y-3">
        {[1,2,3,4].map((i)=>(
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-200" />
              <div className="flex-1">
                <div className="h-5 w-1/3 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
