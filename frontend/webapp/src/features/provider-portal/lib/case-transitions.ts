export const CASE_STEP_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  pending: ["ready", "in_progress", "skipped", "cancelled"],
  ready: ["pending", "in_progress", "skipped", "blocked", "cancelled"],
  in_progress: ["ready", "completed", "blocked", "cancelled"],
  blocked: ["ready", "in_progress", "skipped", "cancelled"],
  completed: ["in_progress"],
  skipped: ["ready"],
  cancelled: ["ready"],
};

export function canTransitionCaseStep(from: string, to: string): boolean {
  return (CASE_STEP_TRANSITIONS[from] ?? []).includes(to);
}
