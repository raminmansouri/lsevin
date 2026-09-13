import { describe, expect, it } from 'vitest';
import { invoiceBreakdown } from './invoice-breakdown';

describe('invoice itemization', () => {
  const addon = { id: 'a', name: 'Equipment', quantity: 2, unitPrice: 10, currency: 'USD' };
  const child = { id: 'c', status: 'Confirmed', provider: 'Hotel', service: 'Stay', date: '', time: '', subtotal: 50, currency: 'USD' };
  it('does not count add-ons and child bookings twice in the main line', () => {
    expect(invoiceBreakdown({ price: 170, currency: 'USD', discountAmount: 0, addons: [addon], childBookings: [child] }).main).toBe(100);
  });
  it('restores the pre-discount main amount for legacy records', () => {
    expect(invoiceBreakdown({ price: 150, currency: 'USD', discountAmount: 20, addons: [addon], childBookings: [child] })).toEqual({ main: 100, discount: 20 });
  });
  it('uses the saved main subtotal rather than current catalog pricing', () => {
    expect(invoiceBreakdown({ price: 150, mainSubtotal: 100, discountAmount: 20 }).main).toBe(100);
  });
  it('never subtracts foreign-currency lines from the invoice total', () => {
    expect(invoiceBreakdown({ price: 170, currency: 'USD', discountAmount: 0, childBookings: [{ ...child, currency: 'EUR' }] }).main).toBeNull();
  });
  it('does not manufacture an amount when discount information is unavailable', () => {
    expect(invoiceBreakdown({ price: 170, discountAmount: null }).main).toBeNull();
  });
  it('preserves zero-price services and zero-quantity add-ons', () => {
    expect(invoiceBreakdown({ price: 0, discountAmount: 0, addons: [{ ...addon, quantity: 0 }] }).main).toBe(0);
    expect(invoiceBreakdown({ price: 50, mainSubtotal: 0 }).main).toBe(0);
  });
  it('does not hide inconsistent or non-finite amounts behind a zero main price', () => {
    expect(invoiceBreakdown({ price: 10, discountAmount: 0, childBookings: [child] }).main).toBeNull();
    expect(invoiceBreakdown({ price: NaN, discountAmount: 0 }).main).toBeNull();
  });
});
