import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { normalizePortalLocale } from "./config";
import { translatePortalText } from "./translate";

const TRANSLATED_STRING_PROPS = new Set([
  "aria-label",
  "confirmMessage",
  "description",
  "emptyDescription",
  "emptyTitle",
  "help",
  "label",
  "placeholder",
  "searchPlaceholder",
  "title",
]);

/**
 * Localizes literal UI copy in a resolved server-component tree.
 *
 * Entity data, rich text, IDs, URLs and user input are deliberately untouched.
 * Nested feature components receive the active locale through an optional
 * `locale` prop and can localize their own internally-created tree.
 */
export function localizeReactTree(node: ReactNode, localeValue: string): ReactNode {
  const locale = normalizePortalLocale(localeValue).locale;
  if (typeof node === "string") return translatePortalText(locale, node);
  if (typeof node === "number" || typeof node === "boolean" || node == null) return node;
  if (Array.isArray(node)) return node.map((child) => localizeReactTree(child, locale));
  if (!isValidElement(node)) return node;

  const element = node as ReactElement<Record<string, unknown>>;
  const props: Record<string, unknown> = { ...element.props };
  for (const name of TRANSLATED_STRING_PROPS) {
    if (typeof props[name] === "string") props[name] = translatePortalText(locale, props[name] as string);
  }
  const skipChildren = props["data-user-content"] != null || props["data-no-auto-translate"] != null;
  if ("children" in props && !skipChildren) {
    props.children = Children.map(props.children as ReactNode, (child) => localizeReactTree(child, locale));
  }
  if (typeof element.type === "function" && props.locale == null) props.locale = locale;
  return cloneElement(element, props);
}

