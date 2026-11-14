"use client";

import type { ReactNode } from "react";
import { useLocale } from "next-intl";

const PATTERN = /\*\*([^*\n]+)\*\*|\[([^\]\n]+)\]\(\s*([^)\s]+)\s*\)/g;

export function AssistantRichText({ text }: { text: string }) {
  const locale = useLocale();
  const parts: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    if (match[1]) {
      parts.push(<strong key={index}>{match[1]}</strong>);
    } else {
      const label = match[2];
      const url = match[3];
      if (url.startsWith("/") && !url.startsWith("//")) {
        const href = url.startsWith(`/${locale}/`) ? url : `/${locale}${url}`;
        parts.push(
          <a key={index} href={href} className="font-semibold text-[#0a5a44] underline underline-offset-2">
            {label}
          </a>
        );
      } else {
        parts.push(label);
      }
    }
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return <>{parts}</>;
}