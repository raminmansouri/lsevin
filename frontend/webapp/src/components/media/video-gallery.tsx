"use client";

import { useRef, useState } from "react";
import { Maximize2, Play } from "lucide-react";

export type GalleryVideo = {
  id: string;
  /** Fully-resolved playable URL. */
  src: string;
  title?: string | null;
  poster?: string | null;
};

/**
 * Reusable video player + playlist used on provider / service / staff pages.
 * Uses the native <video> element (controls + built-in fullscreen) so there is
 * no extra dependency. When more than one video is present it shows a thumbnail
 * playlist; the maximize button opens a true "full view" via the Fullscreen API.
 */
export function VideoGallery({
  videos,
  className,
}: {
  videos: GalleryVideo[];
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!videos.length) return null;

  const current = videos[Math.min(active, videos.length - 1)];

  const goFullscreen = () => {
    const el = videoRef.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;
    if (!el) return;
    if (el.requestFullscreen) {
      void el.requestFullscreen();
    } else if (el.webkitEnterFullscreen) {
      el.webkitEnterFullscreen();
    }
  };

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-md">
        <video
          ref={videoRef}
          key={current.id}
          src={current.src}
          poster={current.poster || undefined}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black"
        />
        <button
          type="button"
          onClick={goFullscreen}
          aria-label="Full view"
          className="absolute end-3 top-3 z-10 rounded-full bg-black/55 p-2 text-white backdrop-blur transition hover:bg-black/75"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {current.title ? (
        <p className="mt-2 line-clamp-1 text-sm font-semibold text-gray-900">
          {current.title}
        </p>
      ) : null}

      {videos.length > 1 ? (
        <div className="hide-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
          {videos.map((video, index) => (
            <button
              key={video.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={video.title || `Video ${index + 1}`}
              className={[
                "relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-black transition",
                index === active
                  ? "border-[#083f30]"
                  : "border-transparent opacity-80 hover:opacity-100",
              ].join(" ")}
            >
              {video.poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.poster}
                  alt={video.title || ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <video
                  src={video.src}
                  muted
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              )}
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="h-5 w-5 fill-white/90 text-white drop-shadow" />
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
