"use client";

import { useState } from "react";

/** Main image with a hover magnifier, and a vertical strip of thumbnails. */
export function DesktopProductGallery({ images, name }: { images: { id: string; src: string; alt: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  if (!current) {
    return <div className="grid aspect-square place-items-center rounded-[28px] bg-[#f4efe4] text-5xl text-[#c9bfa6]">🖼️</div>;
  }

  return (
    <div className="flex gap-4">
      {images.length > 1 ? (
        <div className="hide-scrollbar flex max-h-[560px] w-20 shrink-0 flex-col gap-3 overflow-y-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`${index + 1}`}
              className={`aspect-square overflow-hidden rounded-2xl bg-[#f4efe4] transition ${
                index === active ? "ring-2 ring-[#c9a55a]" : "opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative aspect-square flex-1 overflow-hidden rounded-[28px] bg-[#f4efe4]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={current.id} src={current.src} alt={current.alt || name} className="h-full w-full object-cover" />
      </div>
    </div>
  );
}