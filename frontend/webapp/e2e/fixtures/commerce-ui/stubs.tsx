import type { ReactNode } from "react";

export const env = { NEXT_PUBLIC_FILES_URL: "http://localhost:3022" };
export function ImageWithFallback() {
  return null;
}
export function RichTextPreview({ content }: { content: string }) {
  return <p>{content}</p>;
}
export const useRouter = () => ({
  push: (path: string) => {
    window.location.assign(path);
  },
});
export const Link = ({ children }: { children: ReactNode }) => (
  <span>{children}</span>
);
export async function saveAddressAction() {
  return { ok: true };
}
export async function quoteCheckoutAction() {
  return { ok: true, quote: (window as any).__quote };
}
export async function placeOrderAction(input: unknown) {
  const state = window as any;
  state.__attempts = [...(state.__attempts || []), input];
  return {
    ok: true,
    order: { orderNumber: "test-order" },
    payment: state.__payment || {
      mode: "error",
      message: "Payment service unavailable",
    },
  };
}
