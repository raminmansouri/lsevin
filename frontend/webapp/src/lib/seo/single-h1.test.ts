import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// Public pages render the mobile view and the desktop view side by side (one is
// hidden with CSS). Google indexes the mobile rendering, so the mobile view owns
// the page's single <h1>; the desktop views use an ARIA level-1 heading.
const SRC = path.resolve(__dirname, "../..");
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), "utf8");

const PUBLIC_DESKTOP_VIEWS = [
  "features/web-desktop/home/DesktopHero.tsx",
  "features/web-desktop/categories/DesktopCategoryBrowser.tsx",
  "features/web-desktop/provider/DesktopProviderView.tsx",
  "features/web-desktop/service/DesktopServiceView.tsx",
  "features/web-desktop/shop/DesktopProductPage.tsx",
  "features/web-desktop/shop/DesktopShopHome.tsx",
  "features/web-desktop/explore/DesktopExploreView.tsx",
  "features/web-desktop/offers/DesktopOffersView.tsx",
  "features/web-desktop/packages/DesktopPackages.tsx",
  "features/web-desktop/tours/DesktopToursHome.tsx",
  "features/web-desktop/tours/DesktopTourDetail.tsx",
  "features/web-desktop/legal/DesktopPrivacyPolicy.tsx",
  "features/web-desktop/nearby/DesktopNearbyView.tsx",
];

describe("one h1 per public page", () => {
  it.each(PUBLIC_DESKTOP_VIEWS)("%s uses an ARIA heading, not <h1>", (file) => {
    const source = read(file);
    expect(source).not.toMatch(/<h1[\s>]/);
    expect(source).toContain('role="heading" aria-level={1}');
  });

  it("the mobile shop and the consultation page keep a real h1", () => {
    expect(read("app/[locale]/n/app/mobile/shop/page.tsx")).toMatch(/<h1[\s>]/);
    expect(read("app/[locale]/(main)/consulting/page.tsx")).toMatch(/<h1[\s>]/);
  });
});
