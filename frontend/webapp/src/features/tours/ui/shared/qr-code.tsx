"use client";

import { useMemo } from "react";

import { encodeQr, qrPath, type QrEcc } from "./qr";

/** Inline SVG QR code. `label` is the accessible name (e.g. "Check-in code for TR-XXXX"). */
export function QrCode({
  value,
  label,
  size = 192,
  ecc = "M",
  className,
}: {
  value: string;
  label: string;
  size?: number;
  ecc?: QrEcc;
  className?: string;
}) {
  const svg = useMemo(() => {
    try {
      return qrPath(encodeQr(value, ecc));
    } catch {
      return null;
    }
  }, [value, ecc]);
  if (!svg) return null;
  return (
    <svg
      role="img"
      aria-label={label}
      data-testid="voucher-qr"
      width={size}
      height={size}
      viewBox={`0 0 ${svg.viewBox} ${svg.viewBox}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width="100%" height="100%" fill="#fff" />
      <path d={svg.d} fill="#000" />
    </svg>
  );
}
