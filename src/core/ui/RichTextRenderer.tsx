import { richTextToHtml } from "@core/rich-text/codec";
import { cn } from "@core/lib/cn";

export function RichTextRenderer({ value, className }: { value?: string | null; className?: string }) {
  const html = richTextToHtml(value);
  if (!html) return null;
  return <div data-user-content className={cn("prose prose-sm max-w-none", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
