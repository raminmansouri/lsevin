import type { ChangePasswordInput } from "./types";

export async function changePasswordWithIdentityProvider(input: ChangePasswordInput): Promise<void> {
  const endpoint = process.env.IDENTITY_CHANGE_PASSWORD_URL;

  if (!endpoint) {
    throw new Error(
      "Password change adapter is not configured. Set IDENTITY_CHANGE_PASSWORD_URL or wire this adapter to your ASP.NET Identity endpoint.",
    );
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      confirmPassword: input.confirmPassword,
    }),
  });

  if (!response.ok) {
    let message = "Password update failed.";
    try {
      const payload = await response.json();
      message = payload?.message || payload?.error || message;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
}
