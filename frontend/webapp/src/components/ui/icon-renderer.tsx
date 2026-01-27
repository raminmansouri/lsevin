"use client";

import { memo } from "react";
import { icons, ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

interface IconRendererProps {
  iconName?: string;
  className?: string;
  size?: number;
  fallback?: React.ReactNode;
}

export const IconRenderer = memo(
  ({ iconName, className, size = 24, fallback }: IconRendererProps) => {
    if (!iconName) {
      return fallback ? (
        <>{fallback}</>
      ) : (
        <ImageOff className={cn(className)} size={size} />
      );
    }

    // Get the icon component from lucide-react icons object
    const LucideIcon = icons[iconName as keyof typeof icons];

    if (!LucideIcon) {
      return fallback ? (
        <>{fallback}</>
      ) : (
        <ImageOff className={cn(className)} size={size} />
      );
    }

    return <LucideIcon size={size} className={cn(className)} />;
  }
);

IconRenderer.displayName = "IconRenderer";
