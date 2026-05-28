import type { CSSProperties } from "react";

export const DEFAULT_CATEGORY_OVERLAY_COLOR = "#083f30";
export const DEFAULT_CATEGORY_OVERLAY_OPACITY = 0.85;

export type CategoryOverlayConfig = {
  color: string;
  opacity: number;
};

function clampOpacity(value: unknown): number {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) return DEFAULT_CATEGORY_OVERLAY_OPACITY;

  return Math.min(1, Math.max(0, numericValue));
}

function normalizeHexColor(value?: string | null): string {
  const color = (value || "").trim();

  if (/^#[0-9a-f]{3}$/i.test(color)) {
    const [, r, g, b] = color;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return color.toLowerCase();
  }

  return DEFAULT_CATEGORY_OVERLAY_COLOR;
}

function hexToRgb(hex: string) {
  const normalizedHex = normalizeHexColor(hex).replace("#", "");

  return {
    r: Number.parseInt(normalizedHex.slice(0, 2), 16),
    g: Number.parseInt(normalizedHex.slice(2, 4), 16),
    b: Number.parseInt(normalizedHex.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((value) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgba(hex: string, opacity: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clampOpacity(opacity).toFixed(2)})`;
}

function parseOpacity(value?: string | null): number | undefined {
  if (!value) return undefined;

  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return undefined;

  return clampOpacity(normalized > 1 ? normalized / 100 : normalized);
}

function getFirstRgbaConfig(value: string): CategoryOverlayConfig | null {
  const rgbaMatch = value.match(/rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)/i);

  if (!rgbaMatch) return null;

  return {
    color: rgbToHex(Number(rgbaMatch[1]), Number(rgbaMatch[2]), Number(rgbaMatch[3])),
    opacity: clampOpacity(Number(rgbaMatch[4])),
  };
}

function getCompactOverlayConfig(value: string): CategoryOverlayConfig | null {
  const compactMatch = value.match(/^(#[0-9a-f]{3}(?:[0-9a-f]{3})?)(?:\/(\d{1,3}(?:\.\d+)?|0?\.\d+))?$/i);

  if (!compactMatch) return null;

  return {
    color: normalizeHexColor(compactMatch[1]),
    opacity: parseOpacity(compactMatch[2]) ?? DEFAULT_CATEGORY_OVERLAY_OPACITY,
  };
}

function getTailwindArbitraryOverlayConfig(value: string): CategoryOverlayConfig | null {
  const arbitraryMatch = value.match(/\[(#[0-9a-f]{3}(?:[0-9a-f]{3})?)\](?:\/(\d{1,3}(?:\.\d+)?|0?\.\d+))?/i);

  if (!arbitraryMatch) return null;

  return {
    color: normalizeHexColor(arbitraryMatch[1]),
    opacity: parseOpacity(arbitraryMatch[2]) ?? DEFAULT_CATEGORY_OVERLAY_OPACITY,
  };
}

function getFirstHexConfig(value: string): CategoryOverlayConfig | null {
  const hexMatch = value.match(/#[0-9a-f]{3}(?:[0-9a-f]{3})?/i);

  if (!hexMatch) return null;

  return {
    color: normalizeHexColor(hexMatch[0]),
    opacity: DEFAULT_CATEGORY_OVERLAY_OPACITY,
  };
}

function isTailwindGradient(value: string) {
  return value.includes("from-") || value.includes("via-") || value.includes("to-");
}

function isCssGradient(value: string) {
  return /^linear-gradient\(/i.test(value);
}

function isArbitraryTailwindGradient(value: string) {
  return isTailwindGradient(value) && value.includes("[") && value.includes("]");
}

export function buildCategoryOverlayGradient(
  color: string = DEFAULT_CATEGORY_OVERLAY_COLOR,
  opacity: number = DEFAULT_CATEGORY_OVERLAY_OPACITY
): string {
  const normalizedColor = normalizeHexColor(color);
  const normalizedOpacity = clampOpacity(opacity);
  const midOpacity = Math.max(0, normalizedOpacity * 0.45);

  return `linear-gradient(to top, ${rgba(normalizedColor, normalizedOpacity)} 0%, ${rgba(
    normalizedColor,
    midOpacity
  )} 55%, rgba(0, 0, 0, 0) 100%)`;
}

/**
 * Compact DB value that fits safely in category.categories.gradient varchar(100).
 * It intentionally keeps the legacy Tailwind-like shape so older rows remain readable,
 * while the renderer converts arbitrary colors to inline CSS instead of relying on
 * Tailwind to compile dynamic classes from the database.
 */
export function buildCategoryOverlayValue(
  color: string = DEFAULT_CATEGORY_OVERLAY_COLOR,
  opacity: number = DEFAULT_CATEGORY_OVERLAY_OPACITY
): string {
  const normalizedColor = normalizeHexColor(color);
  const normalizedOpacity = Math.round(clampOpacity(opacity) * 100);
  const midOpacity = Math.round(Math.max(0, clampOpacity(opacity) * 45));

  return `from-[${normalizedColor}]/${normalizedOpacity} via-[${normalizedColor}]/${midOpacity} to-transparent`;
}

export function extractCategoryOverlayConfig(gradient?: string | null): CategoryOverlayConfig {
  const value = (gradient || "").trim();

  if (!value) {
    return {
      color: DEFAULT_CATEGORY_OVERLAY_COLOR,
      opacity: DEFAULT_CATEGORY_OVERLAY_OPACITY,
    };
  }

  return (
    getCompactOverlayConfig(value) ||
    getFirstRgbaConfig(value) ||
    getTailwindArbitraryOverlayConfig(value) ||
    getFirstHexConfig(value) || {
      color: DEFAULT_CATEGORY_OVERLAY_COLOR,
      opacity: DEFAULT_CATEGORY_OVERLAY_OPACITY,
    }
  );
}

export function getCategoryOverlayStyle(gradient?: string | null): CSSProperties | undefined {
  const value = (gradient || "").trim();

  if (!value) return undefined;

  if (isCssGradient(value)) {
    return { background: value };
  }

  if (isArbitraryTailwindGradient(value)) {
    const config = getTailwindArbitraryOverlayConfig(value);
    return config ? { background: buildCategoryOverlayGradient(config.color, config.opacity) } : undefined;
  }

  if (!isTailwindGradient(value)) {
    const config = getCompactOverlayConfig(value) || getFirstHexConfig(value);
    return config ? { background: buildCategoryOverlayGradient(config.color, config.opacity) } : undefined;
  }

  return undefined;
}

export function getCategoryOverlayClassName(
  gradient?: string | null,
  fallback = "from-[#083f30]/90 via-[#083f30]/45 to-transparent"
): string {
  const value = (gradient || "").trim();

  if (!value) return fallback;

  if (isCssGradient(value) || isArbitraryTailwindGradient(value) || !isTailwindGradient(value)) {
    return "";
  }

  return value;
}
