import { describe, expect, it } from 'vitest';

import { toPublicPath } from './public-paths';

describe('toPublicPath', () => {
  it.each([
    ['/n/app/mobile/provider/abc', '/providers/abc'],
    ['/n/app/mobile/service/abc', '/services/abc'],
    ['/n/app/mobile/service/abc/gallery', '/services/abc/gallery'],
    ['/n/app/mobile/specialist/abc?tab=about', '/specialists/abc?tab=about'],
    ['/n/app/mobile/packages', '/packages'],
    ['/n/app/mobile/packages/gold', '/packages/gold'],
    ['/n/app/mobile/shop', '/shop'],
    ['/n/app/mobile/shop/category/skin', '/shop/skin'],
    ['/n/app/mobile/shop/product/serum', '/products/serum'],
    ['/n/app/mobile/map-discovery?city=tehran', '/map?city=tehran'],
    ['/n/app/mobile/explore', '/explore'],
    ['/fa/n/app/mobile/offers', '/fa/offers'],
    ['https://lsevincare.com/en/n/app/mobile/provider/x#about', 'https://lsevincare.com/en/providers/x#about'],
    ['/fa/n/app/mobile/home', '/fa'],
    ['/en/n/app/mobile/home?countryCode=GB', '/en?countryCode=GB'],
    ['https://lsevincare.com/ar/n/app/mobile/home', 'https://lsevincare.com/ar'],
    ['/n/app/mobile/home', '/'],
    ['/n/app/mobile/home?x=1', '/?x=1'],
    ['/fa/n/app/mobile/medical/clinics', '/fa/clinics'],
  ])('%s -> %s', (from, to) => {
    expect(toPublicPath(from)).toBe(to);
  });

  it.each([
    '/n/app/mobile/homepage',
    '/n/app/mobile/shop/cart',
    '/n/app/mobile/shop/checkout',
    '/n/app/mobile/shop/order/123',
    '/n/app/mobile/packages/gold/checkout',
    '/n/app/mobile/profile/rewards',
    '/n/app/mobile/medical/clinics/x',
    '/n/app/mobile/search?q=x',
    '/providers/already-new',
    'https://example.com/elsewhere',
  ])('leaves %s alone', (path) => {
    expect(toPublicPath(path)).toBe(path);
  });
});
