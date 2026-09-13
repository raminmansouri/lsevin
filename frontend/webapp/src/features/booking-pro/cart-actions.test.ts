import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resolveCurrentUserId: vi.fn(), saveBookingToCart: vi.fn(),
  removeBookingFromCart: vi.fn(), revalidatePath: vi.fn(),
}));
vi.mock('../booking-pro/utils/auth', () => ({ resolveCurrentUserId: mocks.resolveCurrentUserId }));
vi.mock('../booking-pro/server/cart.repository', () => ({
  saveBookingToCart: mocks.saveBookingToCart, removeBookingFromCart: mocks.removeBookingFromCart,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
import { changeBookingCart } from './actions/cart';

const draftId = 'ad39af13-147e-4c62-b142-ae527dc64e13';
describe('booking cart actions', () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.resolveCurrentUserId.mockResolvedValue('customer-a'); });
  it('saves with the session owner, ignoring a client-supplied owner', async () => {
    await changeBookingCart({ action: 'save', draftId, userId: 'customer-b' });
    expect(mocks.saveBookingToCart).toHaveBeenCalledWith('customer-a', draftId);
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/[locale]/n/app/mobile/shop/cart', 'page');
  });
  it('removes only through the owner-scoped repository', async () => {
    await changeBookingCart({ action: 'remove', draftId });
    expect(mocks.removeBookingFromCart).toHaveBeenCalledWith('customer-a', draftId);
    expect(mocks.saveBookingToCart).not.toHaveBeenCalled();
  });
  it('rejects unauthenticated changes', async () => {
    mocks.resolveCurrentUserId.mockResolvedValue(null);
    await expect(changeBookingCart({ action: 'save', draftId })).rejects.toThrow('Unauthorized');
    expect(mocks.saveBookingToCart).not.toHaveBeenCalled();
  });
  it('rejects malformed draft identifiers', async () => {
    await expect(changeBookingCart({ action: 'save', draftId: 'bad' })).rejects.toThrow();
    expect(mocks.saveBookingToCart).not.toHaveBeenCalled();
  });
  it('does not report success when the draft cannot be changed', async () => {
    mocks.saveBookingToCart.mockRejectedValue(new Error('BOOKING_DRAFT_NOT_EDITABLE'));
    await expect(changeBookingCart({ action: 'save', draftId })).rejects.toThrow('BOOKING_DRAFT_NOT_EDITABLE');
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
