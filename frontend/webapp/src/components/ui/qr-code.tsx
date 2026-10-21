"use client";

import { useMemo } from "react";

import qrcode from "@/lib/qr/qrcode-generator";

// Without this the encoder treats input as Latin-1 and mangles non-ASCII URLs.
qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

/** Crisp, print-safe QR code drawn as a single SVG path (no canvas, no network). */
export function QrCode({
  value,
  size = 128,
  margin = 2,
  className,
  title,
}: {
  value: string;
  size?: number;
  margin?: number;
  className?: string;
  title?: string;
}) {
  const { path, count } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let row = 0; row < n; row += 1) {
      for (let col = 0; col < n; col += 1) {
        if (qr.isDark(row, col)) d += `M${col + margin} ${row + margin}h1v1h-1z`;
      }
    }
    return { path: d, count: n + margin * 2 };
  }, [value, margin]);

  return (
    <svg
      role="img"
      aria-label={title}
      width={size}
      height={size}
      viewBox={`0 0 ${count} ${count}`}
      shapeRendering="crispEdges"
      className={className}
    >
      {title ? <title>{title}</title> : null}
      <rect width={count} height={count} fill="#ffffff" />
      <path d={path} fill="#0b1f17" />
    </svg>
  );
}
