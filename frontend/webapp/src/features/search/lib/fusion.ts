export type RankedList = { name: string; weight: number; ids: string[] };

/**
 * Reciprocal rank fusion: a document's score is the sum over lists of weight / (k + rank).
 * Only the order inside each list matters, so keyword scores, cosine similarities and
 * distances (which cannot be compared) combine safely. k = 60 is the standard constant.
 */
export function reciprocalRankFusion(lists: RankedList[], k = 60): Map<string, { score: number; lists: Set<string> }> {
  const fused = new Map<string, { score: number; lists: Set<string> }>();
  for (const list of lists) {
    list.ids.forEach((id, position) => {
      const entry = fused.get(id) ?? { score: 0, lists: new Set<string>() };
      entry.score += list.weight / (k + position + 1);
      entry.lists.add(list.name);
      fused.set(id, entry);
    });
  }
  return fused;
}
