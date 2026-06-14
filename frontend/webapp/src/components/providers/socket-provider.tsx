"use client";

import React, { useEffect } from "react";

import { env } from "@/config/env/client";
import { useSocketStore } from "@/stores/socket.store";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { startConnection, stopConnection } = useSocketStore();

  useEffect(() => {
    // Start the connection on mount
    startConnection(env.NEXT_PUBLIC_SOCKET_URL);

    // Cleanup: stop the connection on unmount
    return () => {
      stopConnection();
    };
    // Make sure to not re-run effect repeatedly unless SOCKET_URL changes
  }, [startConnection, stopConnection]);

  return <>{children}</>;
}
