// import { MediaManager } from "@/features/media/components/MediaManager";

import { MediaManager } from "@/components/media";

export default function MediaLibraryPage() {
  return (
    <div className="h-[calc(100vh-2rem)] p-4 sm:p-6">
      <div className="h-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <MediaManager mode="library" />
      </div>
    </div>
  );
}
