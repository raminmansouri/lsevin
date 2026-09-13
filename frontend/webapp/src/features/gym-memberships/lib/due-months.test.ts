import { describe, expect, it } from 'vitest';
import { isMonthDue, nextMonths } from './due-months';

describe('isMonthDue', () => {
  const now = new Date(Date.UTC(2026, 8, 15)); // 2026-09-15

  it('is due once the period month has started and nothing has been approved yet', () => {
    expect(isMonthDue('2026-09-01', 'pending_review', now)).toBe(true);
    expect(isMonthDue('2026-08-01', 'pending_review', now)).toBe(true);
    expect(isMonthDue('2026-08-01', 'rejected', now)).toBe(true);
  });

  it('is never due once approved, regardless of the month', () => {
    expect(isMonthDue('2026-01-01', 'approved', now)).toBe(false);
    expect(isMonthDue('2026-09-01', 'approved', now)).toBe(false);
  });

  it('is not due for a future month', () => {
    expect(isMonthDue('2026-10-01', 'pending_review', now)).toBe(false);
  });

  it('accepts a Date the same as a "YYYY-MM-DD" string', () => {
    expect(isMonthDue(new Date(Date.UTC(2026, 8, 1)), 'pending_review', now)).toBe(true);
  });
});

describe('nextMonths', () => {
  it('lists calendar months forward from the given date, inclusive', () => {
    expect(nextMonths(3, new Date(Date.UTC(2026, 10, 20)))).toEqual(['2026-11', '2026-12', '2027-01']);
  });

  it('rolls the year over correctly', () => {
    expect(nextMonths(2, new Date(Date.UTC(2026, 11, 5)))).toEqual(['2026-12', '2027-01']);
  });

  it('supports the full 12-month prepay case', () => {
    const months = nextMonths(12, new Date(Date.UTC(2026, 0, 1)));
    expect(months).toHaveLength(12);
    expect(months[0]).toBe('2026-01');
    expect(months[11]).toBe('2026-12');
  });
});
