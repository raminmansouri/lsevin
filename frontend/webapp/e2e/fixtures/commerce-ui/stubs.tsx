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
export const Link = ({
  children,
  ...props
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) => <a {...props}>{children}</a>;
export async function saveAddressAction() {
  return { ok: true };
}
export const saveCheckoutAddressAction = saveAddressAction;
export async function startPaymentAction(input: unknown) {
  const state = window as any;
  state.__paymentAttempts = [...(state.__paymentAttempts || []), input];
  return {
    ok: true,
    payment: state.__payment || {
      mode: "error",
      message: "Payment service unavailable",
    },
  };
}
export async function quoteCheckoutAction() {
  if ((window as any).__quoteFailure) throw new Error("Quote unavailable");
  return { ok: true, quote: (window as any).__quote };
}
export async function placeOrderAction(input: unknown) {
  const state = window as any;
  state.__attempts = [...(state.__attempts || []), input];
  return {
    ok: true,
    order: { orderId: "test-order-id", orderNumber: "test-order" },
    payment: state.__payment || {
      mode: "error",
      message: "Payment service unavailable",
    },
  };
}
export function ConsultationStep() {
  return <div>فرم مشاوره</div>;
}
