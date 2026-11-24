import { cn } from "@/lib/utils";

export function FramedImage({
  src,
  alt,
  className,
  imgClassName,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}) {
  const loading = priority ? "eager" : "lazy";
  return (
    <span className={cn("group/frame relative block overflow-hidden bg-[#0b2a21]", className)}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading={loading}
        decoding="async"
        className="absolute inset-0 h-full w-full scale-125 object-cover opacity-90 blur-2xl saturate-150 transition-transform duration-700 group-hover/frame:scale-[1.35]"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_30%,rgba(4,33,26,0.45)_100%)]"
      />
      <span className="absolute inset-0 flex items-center justify-center p-[6%]">
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          className={cn(
            "h-full w-auto max-w-full rounded-xl object-contain shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)] ring-1 ring-[#eacb7f]/40 transition-transform duration-500 group-hover/frame:scale-[1.03]",
            imgClassName,
          )}
        />
      </span>
    </span>
  );
}