import React from "react";
import { SerializedEditorState, SerializedLexicalNode } from "lexical";

// Helper function to check if Lexical content has actual text
function hasTextContent(node: SerializedLexicalNode): boolean {
  if (!node) return false;

  // If it's a text node with text, return true
  if (node.type === "text" && "text" in node && node.text) {
    return true;
  }

  // If it has children, recursively check them
  if ("children" in node && Array.isArray(node.children)) {
    return node.children.some((child) => hasTextContent(child));
  }

  return false;
}

// Check if the entire editor state has text content
export function hasLexicalContent(content: string): boolean {
  try {
    const editorState: SerializedEditorState = JSON.parse(content);

    return (
      editorState.root?.children?.some((child) => hasTextContent(child)) ||
      false
    );
  } catch {
    return false;
  }
}

type TextNode = {
  type: "text";
  text: string;
  format?: number;
  style?: string;
};

type ParagraphNode = {
  type: "paragraph";
  children: SerializedLexicalNode[];
  format?: string;
  direction?: string | null;
};

type HeadingNode = {
  type: "heading";
  tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  children: SerializedLexicalNode[];
};

type ListNode = {
  type: "list";
  listType: "bullet" | "number" | "check";
  children: SerializedLexicalNode[];
};

type ListItemNode = {
  type: "listitem";
  children: SerializedLexicalNode[];
  checked?: boolean;
};

type QuoteNode = {
  type: "quote";
  children: SerializedLexicalNode[];
};

// Text format flags from Lexical
const IS_BOLD = 1;
const IS_ITALIC = 1 << 1;
const IS_STRIKETHROUGH = 1 << 2;
const IS_UNDERLINE = 1 << 3;
const IS_CODE = 1 << 4;
const IS_SUBSCRIPT = 1 << 5;
const IS_SUPERSCRIPT = 1 << 6;

function renderTextNode(node: TextNode, key: number): React.ReactNode {
  let text: React.ReactNode = node.text;
  const format = node.format || 0;

  // Apply formatting based on flags
  if (format & IS_BOLD) {
    text = <strong key={`bold-${key}`}>{text}</strong>;
  }
  if (format & IS_ITALIC) {
    text = <em key={`italic-${key}`}>{text}</em>;
  }
  if (format & IS_UNDERLINE) {
    text = <u key={`underline-${key}`}>{text}</u>;
  }
  if (format & IS_STRIKETHROUGH) {
    text = <s key={`strike-${key}`}>{text}</s>;
  }
  if (format & IS_CODE) {
    text = (
      <code
        key={`code-${key}`}
        className="bg-muted rounded px-1 py-0.5 text-sm"
      >
        {text}
      </code>
    );
  }
  if (format & IS_SUBSCRIPT) {
    text = <sub key={`sub-${key}`}>{text}</sub>;
  }
  if (format & IS_SUPERSCRIPT) {
    text = <sup key={`sup-${key}`}>{text}</sup>;
  }

  return text;
}

function renderNode(node: SerializedLexicalNode, key: number): React.ReactNode {
  if (!node) return null;

  // Text node
  if (node.type === "text") {
    return renderTextNode(node as unknown as TextNode, key);
  }

  // Paragraph node
  if (node.type === "paragraph") {
    const paragraphNode = node as unknown as ParagraphNode;
    const children = paragraphNode.children?.map((child, idx) =>
      renderNode(child, idx)
    );

    const className = [];
    if (paragraphNode.format === "left") className.push("text-left");
    if (paragraphNode.format === "center") className.push("text-center");
    if (paragraphNode.format === "right") className.push("text-right");
    if (paragraphNode.format === "justify") className.push("text-justify");

    return (
      <p
        key={key}
        className={className.join(" ")}
        dir={paragraphNode.direction || undefined}
      >
        {children}
      </p>
    );
  }

  // Heading node
  if (node.type === "heading") {
    const headingNode = node as unknown as HeadingNode;
    const children = headingNode.children?.map((child, idx) =>
      renderNode(child, idx)
    );
    const Tag = headingNode.tag;
    return <Tag key={key}>{children}</Tag>;
  }

  // Quote node
  if (node.type === "quote") {
    const quoteNode = node as unknown as QuoteNode;
    const children = quoteNode.children?.map((child, idx) =>
      renderNode(child, idx)
    );
    return (
      <blockquote key={key} className="border-l-4 border-gray-300 pl-4 italic">
        {children}
      </blockquote>
    );
  }

  // List node
  if (node.type === "list") {
    const listNode = node as unknown as ListNode;
    const children = listNode.children?.map((child, idx) =>
      renderNode(child, idx)
    );

    if (listNode.listType === "number") {
      return (
        <ol key={key} className="list-decimal pl-6">
          {children}
        </ol>
      );
    }

    if (listNode.listType === "check") {
      return (
        <ul key={key} className="list-none pl-0">
          {children}
        </ul>
      );
    }

    return (
      <ul key={key} className="list-disc pl-6">
        {children}
      </ul>
    );
  }

  // List item node
  if (node.type === "listitem") {
    const listItemNode = node as unknown as ListItemNode;
    const children = listItemNode.children?.map((child, idx) =>
      renderNode(child, idx)
    );

    if (listItemNode.checked !== undefined) {
      return (
        <li key={key} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={listItemNode.checked}
            disabled
            readOnly
            className="pointer-events-none"
          />
          {children}
        </li>
      );
    }

    return <li key={key}>{children}</li>;
  }

  return null;
}

export function LexicalRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  try {
    const editorState: SerializedEditorState = JSON.parse(content);

    // Check if there's actual content to render
    if (!editorState.root?.children?.some((child) => hasTextContent(child))) {
      return null;
    }

    const children = editorState.root?.children?.map((child, idx) =>
      renderNode(child, idx)
    );

    return (
      <div className={className} dir={editorState.root?.direction || undefined}>
        {children}
      </div>
    );
  } catch (error) {
    // If JSON parsing fails, check if there's plain text content
    if (content.trim().length === 0) {
      return null;
    }
    console.error("Failed to parse Lexical content:", error);
    return <div className={className}>{content}</div>;
  }
}
