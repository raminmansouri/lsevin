export default function Loading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="px-5 pt-3 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-6 w-40 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-32 bg-gray-100 rounded" />
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-200" />
          </div>
          <div className="flex gap-2 overflow-hidden mb-3">
            {[1,2,3,4].map((i) => <div key={i} className="h-9 w-20 bg-gray-100 rounded-full" />)}
          </div>
          <div className="h-10 bg-gray-100 rounded-xl" />
        </div>
      </div>
      <div className="h-[calc(100vh-240px)] bg-gray-200" />
    </div>
  );
}
