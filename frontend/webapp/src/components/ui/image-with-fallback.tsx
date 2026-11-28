"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import Image, { ImageProps } from "next/image";

import { cn } from "@/lib/utils";

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackIcon?: React.ReactNode;
  fallbackClassName?: string;
}

export const ImageWithFallback = ({
  fallbackIcon,
  fallbackClassName,
  className,
  alt,
  fetchPriority,
  ...props
}: ImageWithFallbackProps) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={cn(
          "bg-muted/20 flex h-full w-full items-center justify-center",
          fallbackClassName
        )}
      >
        {fallbackIcon || <ImageOff className="text-muted-foreground h-8 w-8" />}
      </div>
    );
  }

  return (
    <Image
      {...props}
      // Next 15.6 turned `priority` into preload + eager only; it no longer
      // adds fetchpriority="high", so the page's main photo (usually its
      // Largest Contentful Paint) queued behind scripts and small icons.
      fetchPriority={fetchPriority ?? (props.priority || props.preload ? "high" : undefined)}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};
