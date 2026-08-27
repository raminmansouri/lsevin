export async function register() {
  // Guard to the Node.js runtime: this module also loads under the Edge runtime
  // (middleware), where setInterval-based background work doesn't belong and the
  // pg driver isn't available.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startNotificationDispatchLoop } = await import("./features/notification/server/dispatch-loop");
  startNotificationDispatchLoop();
}
