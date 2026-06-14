"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";

export function DirectionPlugin({ direction }: { direction: "ltr" | "rtl" }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      root.setDirection(direction);
    });
  }, [editor, direction]);

  return null;
}
