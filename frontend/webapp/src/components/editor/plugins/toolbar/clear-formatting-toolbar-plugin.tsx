"use client";

import { useCallback } from "react";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
} from "lexical";
import { EraserIcon } from "lucide-react";

import { useToolbarContext } from "@/components/editor/context/toolbar-context";
import { Button } from "@/components/ui/button";

export function ClearFormattingToolbarPlugin() {
  const { activeEditor } = useToolbarContext();

  const clearFormatting = useCallback(() => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }

      const nodes = selection.getNodes();

      nodes.forEach((node) => {
        if ($isTextNode(node)) {
          // Clear all text formatting
          node.setFormat(0);
          node.setStyle("");
        } else if ($isHeadingNode(node) || $isQuoteNode(node)) {
          // Convert headings and quotes back to paragraphs
          node.replace($createParagraphNode(), true);
        }
      });
    });
  }, [activeEditor]);

  return (
    <Button
      className="!h-8 !w-8"
      aria-label="Clear formatting"
      variant={"outline"}
      size={"icon"}
      onClick={clearFormatting}
      type="button"
    >
      <EraserIcon className="h-4 w-4" />
    </Button>
  );
}
