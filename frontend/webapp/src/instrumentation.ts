export async function register() {
  // Guard to the Node.js runtime: this module also loads under the Edge runtime
  // (middleware), where setInterval-based background work doesn't belong and the
  // pg driver isn't available.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startNotificationDispatchLoop } = await import(
      "./features/notification/server/dispatch-loop"
    );
    startNotificationDispatchLoop();

    // Tours housekeeping (holds/payment deadlines, tracking retention, departure
    // completion, waitlist offers). One process per tick via an advisory lock;
    // TOURS_SWEEPER=off disables it.
    const { startToursSweeper } = await import("./features/tours/server/ops/sweeper");
    startToursSweeper();
  }
}
