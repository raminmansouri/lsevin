import { useState } from "react";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";

import { ContentEditable } from "@/components/editor/editor-ui/content-editable";
import { DirectionPlugin } from "@/components/editor/plugins/direction-plugin";
import { BlockFormatDropDown } from "@/components/editor/plugins/toolbar/block-format-toolbar-plugin";
import { FormatBulletedList } from "@/components/editor/plugins/toolbar/block-format/format-bulleted-list";
import { FormatCheckList } from "@/components/editor/plugins/toolbar/block-format/format-check-list";
import { FormatHeading } from "@/components/editor/plugins/toolbar/block-format/format-heading";
import { FormatNumberedList } from "@/components/editor/plugins/toolbar/block-format/format-numbered-list";
import { FormatParagraph } from "@/components/editor/plugins/toolbar/block-format/format-paragraph";
import { FormatQuote } from "@/components/editor/plugins/toolbar/block-format/format-quote";
import { ClearFormattingToolbarPlugin } from "@/components/editor/plugins/toolbar/clear-formatting-toolbar-plugin";
import { ElementFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/element-format-toolbar-plugin";
import { FontFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/font-format-toolbar-plugin";
import { HistoryToolbarPlugin } from "@/components/editor/plugins/toolbar/history-toolbar-plugin";
import { LinkToolbarPlugin } from "@/components/editor/plugins/toolbar/link-toolbar-plugin";
import { ToolbarPlugin } from "@/components/editor/plugins/toolbar/toolbar-plugin";
import { Separator } from "@/components/ui/separator";

export function Plugins({ direction = "ltr" }: { direction?: "ltr" | "rtl" }) {
  const [_isLinkEditMode, setIsLinkEditMode] = useState(false);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    // Placeholder for future use
  };

  return (
    <div className="relative">
      {/* toolbar plugins */}
      <ToolbarPlugin>
        {() => (
          <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1">
            <HistoryToolbarPlugin />
            <Separator orientation="vertical" className="h-6" />
            <BlockFormatDropDown>
              <FormatParagraph />
              <FormatHeading levels={["h1", "h2", "h3"]} />
              <FormatBulletedList />
              <FormatNumberedList />
              <FormatCheckList />
              <FormatQuote />
            </BlockFormatDropDown>
            <Separator orientation="vertical" className="h-6" />
            <FontFormatToolbarPlugin />
            <Separator orientation="vertical" className="h-6" />
            <LinkToolbarPlugin setIsLinkEditMode={setIsLinkEditMode} />
            <Separator orientation="vertical" className="h-6" />
            <ElementFormatToolbarPlugin direction={direction} />
            <Separator orientation="vertical" className="h-6" />
            <ClearFormattingToolbarPlugin />
          </div>
        )}
      </ToolbarPlugin>
      <div className="relative" dir={direction}>
        <RichTextPlugin
          contentEditable={
            <div className="" dir={direction}>
              <div className="" ref={onRef}>
                <ContentEditable placeholder={""} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <DirectionPlugin direction={direction} />
        {/* editor plugins */}
      </div>
      {/* actions plugins */}
    </div>
  );
}
