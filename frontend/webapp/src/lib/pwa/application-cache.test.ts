import { afterEach, describe, expect, it } from "vitest";

import { chosenImageUrl } from "./application-cache";

/**
 * The offline saver keeps only the image file this device shows. It used to
 * download every srcset width of every photo on the page right after load
 * (64 requests, 1.3 MB on the home page; 2026-11-28).
 */
function img(attributes: Record<string, string>) {
  return { getAttribute: (name: string) => attributes[name] ?? null } as unknown as Element;
}

function device(width: number, ratio: number, matching: string[] = []) {
  (globalThis as unknown as { window: unknown }).window = {
    innerWidth: width,
    devicePixelRatio: ratio,
    matchMedia: (query: string) => ({ matches: matching.includes(query) }),
  };
}

const SRCSET = "/i?w=256 256w, /i?w=384 384w, /i?w=640 640w, /i?w=750 750w, /i?w=1080 1080w, /i?w=1920 1920w";

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe("chosenImageUrl", () => {
  it("picks the smallest width covering a full-width slot at the pixel ratio", () => {
    device(412, 2.5);
    expect(chosenImageUrl(img({ src: "/i?w=1920", srcset: SRCSET, sizes: "100vw" }))).toBe("/i?w=1080");
  });

  it("reads px slots and media conditions in sizes", () => {
    device(412, 2, ["(max-width: 640px)"]);
    expect(chosenImageUrl(img({ src: "/x", srcset: SRCSET, sizes: "96px" }))).toBe("/i?w=256");
    expect(chosenImageUrl(img({ src: "/x", srcset: SRCSET, sizes: "(min-width: 1024px) 25vw, (max-width: 640px) 50vw, 33vw" }))).toBe("/i?w=640");
  });

  it("falls back to the largest candidate, density descriptors and plain src", () => {
    device(2000, 2);
    expect(chosenImageUrl(img({ src: "/x", srcset: SRCSET, sizes: "100vw" }))).toBe("/i?w=1920");
    expect(chosenImageUrl(img({ src: "/a", srcset: "/a1 1x, /a2 2x" }))).toBe("/a2");
    expect(chosenImageUrl(img({ src: "/only" }))).toBe("/only");
  });
});
