import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Link } from "@/i18n/navigation";

export function HomeHeroCard({
  mediaUrl,
  imageAlt,
  badge,
  title,
  description,
  href,
  buttonLabel,
}: {
  mediaUrl?: string | null;
  imageAlt: string;
  badge: string;
  title: string;
  description: ReactNode;
  href: string;
  buttonLabel: string;
}) {
  return (
    <section className="px-5 py-6">
      <div className="relative min-h-48 overflow-hidden rounded-3xl shadow-lg">
        {mediaUrl ? (
          <ImageWithFallback
            fill
            src={mediaUrl}
            alt={imageAlt}
            sizes="100vw"
            className="object-cover"
            // Above the fold on the landing page and its LCP element: lazy
            // loading delayed it until after hydration.
            priority
          />
        ) : (
          <img
            src="/unsplash_images/photo-1540555700478-4be289fbecef__w=1200&h=600&fit=crop.jpg"
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#083f30]/95 via-[#083f30]/85 to-transparent" />
        <div className="relative z-10 flex min-h-48 min-w-0 flex-col justify-center px-5 py-6 sm:px-6">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles
              size={18}
              aria-hidden
              className="shrink-0 text-[#eacb7f]"
            />
            <span className="text-xs font-bold tracking-wide text-[#eacb7f] uppercase">
              {badge}
            </span>
          </div>
          <h2 className="mb-2 text-2xl leading-tight font-bold break-words text-white">
            {title}
          </h2>
          {description}
          <div className="shrink-0">
            <Link
              href={href}
              className="inline-flex max-w-full items-center justify-center rounded-xl bg-[#eacb7f] px-6 py-3 text-center text-sm font-bold text-[#083f30] shadow-lg transition-all hover:bg-[#e0b654] hover:shadow-xl active:scale-95"
            >
              {buttonLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
