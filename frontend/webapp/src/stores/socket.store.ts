import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { create } from "zustand";

type SocketState = {
  connection: HubConnection | null;
  isConnected: boolean;
  setConnection: (connection: HubConnection | null) => void;
  setIsConnected: (isConnected: boolean) => void;
  startConnection: (hub: string) => Promise<void>;
  stopConnection: () => Promise<void>;
};

export const useSocketStore = create<SocketState>((set, get) => ({
  connection: null,
  isConnected: false,

  setConnection: (connection) => set({ connection }),
  setIsConnected: (isConnected) => set({ isConnected }),

  startConnection: async (hub: string) => {
    let { connection } = get();

    // If a connection already exists, you could optionally skip or stop it
    // But for safety, let's explicitly stop an existing connection first
    if (connection) {
      try {
        if (
          connection.state === HubConnectionState.Connected ||
          connection.state === HubConnectionState.Connecting ||
          connection.state === HubConnectionState.Reconnecting
        ) {
          await connection.stop();
        }
      } catch (err: unknown) {
        console.warn(
          "Warning: could not stop existing connection before starting new one",
          err
        );
      }
    }

    // Build new connection
    connection = new HubConnectionBuilder()
      .withUrl(hub, {
        withCredentials: false,
        headers: { "Content-Type": "application/json" },
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    // On reconnecting
    connection.onreconnecting((error) => {
      console.log("Reconnecting...", error ? `Error: ${error}` : "");
      set({ isConnected: false });
    });

    // On reconnected
    connection.onreconnected((connectionId) => {
      console.log(
        "Reconnected!",
        connectionId ? `ConnectionId: ${connectionId}` : ""
      );
      set({ isConnected: true });
    });

    // On close
    connection.onclose((error) => {
      console.log("Connection closed. Error:", error);
      set({ isConnected: false });
    });

    // Start connection
    try {
      await connection.start();
      set({ connection, isConnected: true });
      console.log("Connection started successfully");
    } catch (err) {
      console.error("Failed to connect:", err);
      set({ isConnected: false });

      // Optionally retry
      setTimeout(() => get().startConnection(hub), 5000);
    }
  },

  stopConnection: async () => {
    const { connection } = get();
    if (!connection) return;

    try {
      // Only attempt to stop if we are in a valid state
      if (
        connection.state === HubConnectionState.Connected ||
        connection.state === HubConnectionState.Connecting ||
        connection.state === HubConnectionState.Reconnecting
      ) {
        await connection.stop();
        console.log("Connection stopped gracefully");
      }

      set({ connection: null, isConnected: false });
    } catch {
      set({ isConnected: false });
    }
  },
}));
