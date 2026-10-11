// An infrastructure error is not evidence of sign-out. Only the successful
// NextAuth session shapes can invalidate another user's encrypted snapshot.
export function confirmsSessionChange(value: unknown, owner: string): boolean {
  if (value === null) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (Object.keys(value).length === 0) return true;
  const user = (value as { user?: { id?: unknown } }).user;
  return (
    typeof user?.id === "string" && user.id.length > 0 && user.id !== owner
  );
}
