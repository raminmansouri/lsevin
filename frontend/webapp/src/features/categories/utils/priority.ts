/**
 * Category priority (category.categories.display_order) as admins set it: 1 shows first, 2 next…;
 * 0 (or nothing) means "no priority", which sorts after every prioritised category. The landing
 * and category-browser SQL use the same rule:
 *   order by case when display_order > 0 then 0 else 1 end, display_order
 */
export function priorityRank(displayOrder: number | null | undefined): number {
  const value = Number(displayOrder);
  return Number.isFinite(value) && value > 0 ? value : Number.POSITIVE_INFINITY;
}

/** Comparator: prioritised categories first (ascending), then the rest; ties go to `tieBreak`. */
export function compareByPriority<T extends { displayOrder?: number | null }>(tieBreak: (a: T, b: T) => number) {
  return (a: T, b: T) => {
    const ra = priorityRank(a.displayOrder);
    const rb = priorityRank(b.displayOrder);
    if (ra !== rb) return ra < rb ? -1 : 1;
    return tieBreak(a, b);
  };
}

/** Parses the admin's priority input: empty clears it (0); otherwise a whole number in range. */
export function parsePriorityInput(raw: string, max: number): { ok: true; value: number } | { ok: false } {
  const normalized = raw
    .trim()
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
  if (normalized === "") return { ok: true, value: 0 };
  if (!/^\d+$/.test(normalized)) return { ok: false };
  const value = Number(normalized);
  return value <= max ? { ok: true, value } : { ok: false };
}
