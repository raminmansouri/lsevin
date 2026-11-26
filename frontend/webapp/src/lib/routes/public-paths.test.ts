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
    ['/fa/n/app/mobile/shop/seller/donyamed', '/fa/shop/seller/donyamed'],
    ['/n/app/mobile/shop/seller/donyamed?sort=new', '/shop/seller/donyamed?sort=new'],
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
    ['/fa/n/app/mobile/consultation/doctors', '/fa/consultation/doctors'],
    ['/fa/n/app/mobile/shop/cart', '/fa/shop/cart'],
    ['/n/app/mobile/shop/checkout', '/shop/checkout'],
    ['/n/app/mobile/shop/search?q=serum', '/shop/search?q=serum'],
    ['/fa/n/app/mobile/shop/order/123?email=a', '/fa/account/orders/123?email=a'],
    ['/n/app/mobile/shop/orders/123', '/account/orders/123'],
    ['/n/app/mobile/shop/orders', '/account/orders'],
    ['/n/app/mobile/shop/wishlist', '/account/wishlist'],
    ['/fa/n/app/mobile/bookings', '/fa/account/bookings'],
    ['/n/app/mobile/bookings/b1/invoice?print=1', '/account/bookings/b1/invoice?print=1'],
    ['/fa/n/app/mobile/profile', '/fa/account'],
    ['/n/app/mobile/profile/rewards', '/account/rewards'],
    ['/n/app/mobile/profile/EditProfile', '/account/edit'],
    ['/n/app/mobile/profile/wallet?payment=paid', '/account/wallet?payment=paid'],
    ['/n/app/mobile/profile/my-wallet/history', '/account/wallet/history'],
    ['/n/app/mobile/consultation/doctors?provider=p1', '/consultation/doctors?provider=p1'],
    ['/n/app/mobile/consultation/doctors/abc/book?source=x', '/consultation/doctors/abc/book?source=x'],
  ])('%s -> %s', (from, to) => {
    expect(toPublicPath(from)).toBe(to);
  });

  it.each([
    '/n/app/mobile/homepage',
    '/n/app/mobile/packages/gold/checkout',
    '/n/app/mobile/medical/clinics/x',
    '/n/app/mobile/search?q=x',
    '/providers/already-new',
    'https://example.com/elsewhere',
  ])('leaves %s alone', (path) => {
    expect(toPublicPath(path)).toBe(path);
  });
});
