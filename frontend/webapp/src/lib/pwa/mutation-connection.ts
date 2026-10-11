export const offlineMutationOptions = {
  networkMode: "always",
  retry: false,
} as const;

export class OfflineMutationError extends Error {
  readonly category = "InfrastructureError";
  readonly status = 0;
  readonly title: string;
  constructor(locale: string) {
    const title =
      locale === "fa"
        ? "آفلاین هستید. پس از اتصال دوباره تلاش کنید."
        : "You are offline. Reconnect and try again.";
    super(title);
    this.name = "OfflineMutationError";
    this.title = title;
  }
}

export function assertMutationConnection(online: boolean, locale = "en") {
  if (!online) throw new OfflineMutationError(locale);
}
