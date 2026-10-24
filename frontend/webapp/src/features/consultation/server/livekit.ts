import "server-only";

import { AccessToken } from "livekit-server-sdk";

import type { CallCredentials } from "../call-types";

/**
 * LiveKit access for video consultations. A token is signed here, with no call
 * to the LiveKit server, so it works from every site; only the browser talks
 * to LiveKit. Callers check who may join and when before asking for one.
 */
function liveKitConfig() {
  const serverUrl = process.env.LIVEKIT_URL?.trim();
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
  return serverUrl && apiKey && apiSecret ? { serverUrl, apiKey, apiSecret } : null;
}

/** The room a session's call happens in. */
export function consultationRoomName(sessionId: string): string {
  return `consult-${sessionId}`;
}

/**
 * A token for one person to join one session's room, valid until the room
 * closes. Null when LiveKit isn't configured: the call screen then shows no
 * video, as before.
 */
export async function issueCallToken(args: {
  sessionId: string;
  identity: string;
  role: "doctor" | "patient";
  closesAt: number;
}): Promise<CallCredentials | null> {
  const config = liveKitConfig();
  if (!config) return null;

  const ttlSeconds = Math.max(60, Math.ceil((args.closesAt - Date.now()) / 1000));
  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity: args.identity,
    ttl: ttlSeconds,
    metadata: JSON.stringify({ role: args.role }),
  });
  token.addGrant({
    room: consultationRoomName(args.sessionId),
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  return { serverUrl: config.serverUrl, token: await token.toJwt() };
}
