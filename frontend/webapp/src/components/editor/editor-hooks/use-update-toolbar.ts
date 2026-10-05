import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  BaseSelection,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND,
} from "lexical";

import { useToolbarContext } from "@/components/editor/context/toolbar-context";

export function useUpdateToolbarHandler(
  callback: (selection: BaseSelection) => void
) {
  const [editor] = useLexicalComposerContext();
  const { activeEditor } = useToolbarContext();

  // Keep the latest callback without re-running the effects below: callers pass
  // a new function every render, which used to re-trigger them in a loop.
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    return activeEditor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();
        if (selection) {
          callbackRef.current(selection);
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [activeEditor, editor]);

  useEffect(() => {
    activeEditor.getEditorState().read(() => {
      const selection = $getSelection();
      if (selection) {
        callbackRef.current(selection);
      }
    });
  }, [activeEditor]);
}