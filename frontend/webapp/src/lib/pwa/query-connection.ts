import { onlineManager } from "@tanstack/react-query";

/** A new document opened offline receives no initial browser `offline` event. */
export function initializeQueryConnection() {
  if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean")
    onlineManager.setOnline(navigator.onLine);
}
