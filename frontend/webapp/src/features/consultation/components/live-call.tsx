"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  isTrackReference,
  LiveKitRoom,
  RoomAudioRenderer,
  useChat,
  useConnectionQualityIndicator,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import {
  ConnectionQuality,
  ConnectionState,
  DisconnectReason,
  LocalVideoTrack,
  MediaDeviceFailure,
  type Participant,
  RemoteTrackPublication,
  Track,
} from "livekit-client";
import {
  ClipboardList,
  Headphones,
  Loader2,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SignalZero,
  SwitchCamera,
  User,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { CallCredentials } from "../call-types";
import { recordCallPresenceAction, reportCallProblemAction } from "../server/call-attendance";
import { CallChat } from "./call-chat";
import { type CallChoices, CallPreJoin } from "./call-prejoin";

type Notice = "permission" | "device" | "duplicate" | "failed" | "unreachable";

/** Room options; one object for the page's life so the room is never rebuilt. */
const ROOM_OPTIONS = { adaptiveStream: true, dynacast: true };

/** How long the first connection may take before we suggest another network. */
const CONNECT_TIMEOUT_MS = 20_000;
type Panel = "chat" | "info";

/**
 * The video part of the call room. First a camera and microphone check, then
 * the call: the other side large, yourself small, chat, audio-only mode, the
 * connection quality of both sides and, for the GP, the patient's request
 * beside the call. Disconnects the moment the room closes.
 */
export function LiveCall({
  sessionId,
  call,
  peerName,
  closed,
  infoPanel,
  onLeave,
}: {
  sessionId: string;
  call: CallCredentials;
  /** Who is on the other side, from our own records. */
  peerName: string;
  closed: boolean;
  /** Shown in a side panel during the call (the GP's view of the patient). */
  infoPanel?: React.ReactNode;
  onLeave: () => void;
}) {
  const [choices, setChoices] = useState<CallChoices | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  // The room screen re-renders every second (its clock). New audio/video
  // objects on each render make LiveKit re-apply them, restarting the camera
  // and microphone every second: the picture flashes. Keep them stable.
  const audio = useMemo(
    () => (choices?.audioEnabled ? { deviceId: choices.audioDeviceId || undefined } : false),
    [choices]
  );
  const video = useMemo(
    () => (choices?.videoEnabled ? { deviceId: choices.videoDeviceId || undefined } : false),
    [choices]
  );

  if (!choices) return <CallPreJoin onJoin={setChoices} onBack={onLeave} />;

  return (
    <LiveKitRoom
      serverUrl={call.serverUrl}
      token={call.token}
      connect={!closed}
      audio={audio}
      video={video}
      options={ROOM_OPTIONS}
      onConnected={() => setNotice(null)}
      onDisconnected={(reason) => {
        if (reason === DisconnectReason.DUPLICATE_IDENTITY) setNotice("duplicate");
      }}
      onError={(error) => {
        console.error("[consultation] call error", error);
        setNotice("failed");
        void reportCallProblemAction(sessionId, {
          problem: "error",
          network: networkHint(),
          message: String(error?.message ?? error).slice(0, 300),
        }).catch(() => undefined);
      }}
      onMediaDeviceFailure={(failure) =>
        setNotice(failure === MediaDeviceFailure.PermissionDenied ? "permission" : "device")
      }
      className="relative flex min-h-0 flex-1 flex-col"
    >
      <InCall
        sessionId={sessionId}
        peerName={peerName}
        closed={closed}
        notice={notice}
        infoPanel={infoPanel}
        onLeave={onLeave}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function InCall({
  sessionId,
  peerName,
  closed,
  notice,
  infoPanel,
  onLeave,
}: {
  sessionId: string;
  peerName: string;
  closed: boolean;
  notice: Notice | null;
  infoPanel?: React.ReactNode;
  onLeave: () => void;
}) {
  const t = useTranslations("Consultation.call");
  const [panel, setPanel] = useState<Panel | null>(null);
  const [audioOnly, setAudioOnly] = useState(false);
  const { chatMessages, send, isSending } = useChat();
  const [seenMessages, setSeenMessages] = useState(0);
  const connection = useConnectionState();

  useCallPresence(sessionId);
  const unreachable = useUnreachable(sessionId, closed);
  // Permission, device and duplicate notices say exactly what to do; a plain
  // failure or a connection that never comes up suggests another network.
  const shownNotice: Notice | null =
    notice && notice !== "failed" ? notice : unreachable ? "unreachable" : notice;
  useScreenWakeLock(connection === ConnectionState.Connected);
  useAudioOnlySubscriptions(audioOnly);

  // Messages read while the chat is open don't count as unread.
  useEffect(() => {
    if (panel === "chat") setSeenMessages(chatMessages.length);
  }, [panel, chatMessages.length]);
  const unread = chatMessages.length - seenMessages;

  return (
    <>
      <Stage peerName={peerName} closed={closed} notice={shownNotice} audioOnly={audioOnly} />
      <Controls
        audioOnly={audioOnly}
        onAudioOnly={setAudioOnly}
        unread={panel === "chat" ? 0 : unread}
        hasInfo={Boolean(infoPanel)}
        panel={panel}
        onPanel={(next) => setPanel((current) => (current === next ? null : next))}
        onLeave={onLeave}
      />
      {panel && (
        <aside className="absolute inset-0 z-20 flex flex-col bg-gray-950 sm:inset-y-0 sm:start-auto sm:end-0 sm:w-96 sm:border-s sm:border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="font-bold">{panel === "chat" ? t("chat") : t("patientInfo")}</p>
            <button
              type="button"
              onClick={() => setPanel(null)}
              aria-label={t("closePanel")}
              className="flex size-9 items-center justify-center rounded-full bg-white/10"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            {panel === "chat" ? (
              <CallChat messages={chatMessages} send={send} isSending={isSending} peerName={peerName} />
            ) : (
              <div className="h-full space-y-4 overflow-y-auto bg-gray-50 p-4 text-gray-900">{infoPanel}</div>
            )}
          </div>
        </aside>
      )}
    </>
  );
}

function Stage({
  peerName,
  closed,
  notice,
  audioOnly,
}: {
  peerName: string;
  closed: boolean;
  notice: Notice | null;
  audioOnly: boolean;
}) {
  const t = useTranslations("Consultation.call");
  const state = useConnectionState();
  const cameras = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const remote = cameras.find((ref) => !ref.participant.isLocal);
  const local = cameras.find((ref) => ref.participant.isLocal);
  const remoteVideo =
    !audioOnly && remote && isTrackReference(remote) && !remote.publication.isMuted ? remote : null;
  const localVideo = local && isTrackReference(local) && !local.publication.isMuted ? local : null;

  const status = closed
    ? t("roomClosed")
    : state === ConnectionState.Connecting
      ? t("connecting")
      : state === ConnectionState.Reconnecting || state === ConnectionState.SignalReconnecting
        ? t("reconnecting")
        : null;

  return (
    <div className="relative mx-5 mt-5 flex min-h-0 flex-1 overflow-hidden rounded-3xl bg-white/5">
      {remoteVideo ? (
        <VideoTrack trackRef={remoteVideo} className="absolute inset-0 h-full w-full object-cover sm:object-contain" />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-white/10">
            {audioOnly ? (
              <Headphones className="h-9 w-9 text-white/50" aria-hidden />
            ) : (
              <User className="h-9 w-9 text-white/50" aria-hidden />
            )}
          </div>
          <p className="mt-3 text-sm text-white/70">
            {!remote
              ? t("waitingFor", { name: peerName })
              : audioOnly
                ? t("audioOnlyActive")
                : t("cameraOff", { name: peerName })}
          </p>
        </div>
      )}

      {remote && (
        <div className="absolute start-3 top-3 z-10">
          <QualityBadge participant={remote.participant} name={peerName} />
        </div>
      )}
      {local && (
        <div className="absolute bottom-3 start-3 z-10">
          <QualityBadge participant={local.participant} />
        </div>
      )}

      {localVideo && (
        <div className="absolute bottom-3 end-3 h-36 w-24 overflow-hidden rounded-2xl border border-white/20 bg-black shadow-lg">
          <VideoTrack trackRef={localVideo} className="h-full w-full -scale-x-100 object-cover" />
        </div>
      )}

      {(status || notice) && (
        <div className="absolute inset-x-3 top-14 z-10 flex items-center justify-center gap-2 rounded-2xl bg-black/70 px-3 py-2 text-center text-xs">
          {status && !closed && !notice && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />}
          <span>{notice ? t(`notice.${notice}`) : status}</span>
        </div>
      )}
    </div>
  );
}

/** Signal bars for one side's connection; says so in words when it is weak. */
function QualityBadge({ participant, name }: { participant: Participant; name?: string }) {
  const t = useTranslations("Consultation.call");
  const { quality } = useConnectionQualityIndicator({ participant });
  const weak = quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost;
  const Icon =
    quality === ConnectionQuality.Excellent
      ? SignalHigh
      : quality === ConnectionQuality.Good
        ? SignalMedium
        : quality === ConnectionQuality.Poor
          ? SignalLow
          : SignalZero;
  const label = name
    ? quality === ConnectionQuality.Lost
      ? t("quality.lostPeer", { name })
      : t("quality.weakPeer", { name })
    : t("quality.weakYou");

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
        weak ? "bg-amber-500 text-black" : "bg-black/50 text-white"
      )}
      title={weak ? label : undefined}
    >
      <Icon className={cn("h-4 w-4", !weak && quality === ConnectionQuality.Excellent && "text-emerald-400")} aria-hidden />
      {weak && <span>{label}</span>}
    </div>
  );
}

function Controls({
  audioOnly,
  onAudioOnly,
  unread,
  hasInfo,
  panel,
  onPanel,
  onLeave,
}: {
  audioOnly: boolean;
  onAudioOnly: (value: boolean) => void;
  unread: number;
  hasInfo: boolean;
  panel: Panel | null;
  onPanel: (panel: Panel) => void;
  onLeave: () => void;
}) {
  const t = useTranslations("Consultation.call");
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, cameraTrack } = useLocalParticipant();
  const [facing, setFacing] = useState<"user" | "environment">("user");

  const flipCamera = async () => {
    const track = cameraTrack?.track;
    if (!(track instanceof LocalVideoTrack)) return;
    const next = facing === "user" ? "environment" : "user";
    try {
      await track.restartTrack({ facingMode: next });
      setFacing(next);
    } catch (error) {
      console.error("[consultation] camera flip failed", error);
    }
  };

  const toggleAudioOnly = () => {
    const next = !audioOnly;
    onAudioOnly(next);
    void localParticipant.setCameraEnabled(!next);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 px-5 py-5">
      <RoundButton
        label={isMicrophoneEnabled ? t("muteMic") : t("unmuteMic")}
        off={!isMicrophoneEnabled}
        onClick={() => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
      >
        {isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </RoundButton>
      {!audioOnly && (
        <RoundButton
          label={isCameraEnabled ? t("cameraOffButton") : t("cameraOnButton")}
          off={!isCameraEnabled}
          onClick={() => void localParticipant.setCameraEnabled(!isCameraEnabled)}
        >
          {isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </RoundButton>
      )}
      {!audioOnly && isCameraEnabled && (
        <RoundButton label={t("flipCamera")} onClick={flipCamera}>
          <SwitchCamera className="h-5 w-5" />
        </RoundButton>
      )}
      <RoundButton label={audioOnly ? t("videoBack") : t("audioOnly")} active={audioOnly} onClick={toggleAudioOnly}>
        <Headphones className="h-5 w-5" />
      </RoundButton>
      <RoundButton label={t("chat")} active={panel === "chat"} onClick={() => onPanel("chat")}>
        <MessageSquare className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </RoundButton>
      {hasInfo && (
        <RoundButton label={t("patientInfo")} active={panel === "info"} onClick={() => onPanel("info")}>
          <ClipboardList className="h-5 w-5" />
        </RoundButton>
      )}
      <button
        type="button"
        onClick={onLeave}
        aria-label={t("leave")}
        title={t("leave")}
        className="flex h-12 items-center gap-2 rounded-full bg-red-600 px-4 text-sm font-bold"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{t("leave")}</span>
      </button>
    </div>
  );
}

function RoundButton({
  label,
  off,
  active,
  onClick,
  children,
}: {
  label: string;
  /** A device that is switched off: drawn light, like a crossed-out icon. */
  off?: boolean;
  /** A mode or panel that is on. */
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "relative flex size-12 items-center justify-center rounded-full",
        off ? "bg-white text-gray-900" : active ? "bg-emerald-600 text-white" : "bg-white/15 text-white"
      )}
    >
      {children}
    </button>
  );
}

/**
 * Records this visit to the call room: joining once connected, a ping every
 * minute, and leaving on disconnect or when the page goes away.
 */
function useCallPresence(sessionId: string) {
  const state = useConnectionState();
  const visitRef = useRef<string | null>(null);
  const joiningRef = useRef(false);

  useEffect(() => {
    if (state === ConnectionState.Connected && !visitRef.current && !joiningRef.current) {
      joiningRef.current = true;
      recordCallPresenceAction(sessionId, "join")
        .then((result) => {
          if (result.ok && result.data) visitRef.current = result.data.id;
        })
        .catch((error) => console.error("[consultation] presence join failed", error))
        .finally(() => {
          joiningRef.current = false;
        });
    }
    if (state === ConnectionState.Disconnected && visitRef.current) {
      const visit = visitRef.current;
      visitRef.current = null;
      void recordCallPresenceAction(sessionId, "leave", visit).catch(() => undefined);
    }
  }, [state, sessionId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (visitRef.current) void recordCallPresenceAction(sessionId, "heartbeat", visitRef.current).catch(() => undefined);
    }, 60_000);
    return () => {
      window.clearInterval(timer);
      if (visitRef.current) {
        void recordCallPresenceAction(sessionId, "leave", visitRef.current).catch(() => undefined);
        visitRef.current = null;
      }
    };
  }, [sessionId]);
}

/**
 * True once the first connection has taken too long: some operators can't
 * reach the call server directly. Reported once per visit so failing networks
 * show up in the server logs.
 */
function useUnreachable(sessionId: string, closed: boolean) {
  const state = useConnectionState();
  const [unreachable, setUnreachable] = useState(false);
  const everConnected = useRef(false);
  const reported = useRef(false);

  useEffect(() => {
    if (state === ConnectionState.Connected) {
      everConnected.current = true;
      setUnreachable(false);
      return;
    }
    if (closed || everConnected.current) return;
    const timer = window.setTimeout(() => {
      setUnreachable(true);
      if (reported.current) return;
      reported.current = true;
      void reportCallProblemAction(sessionId, { problem: "unreachable", network: networkHint() }).catch(
        () => undefined
      );
    }, CONNECT_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [state, closed, sessionId]);

  return unreachable;
}

/** The browser's own idea of its network (wifi, cellular, 4g…), where it shares one. */
function networkHint(): string | undefined {
  const connection = (navigator as Navigator & { connection?: { type?: string; effectiveType?: string } })
    .connection;
  const hint = [connection?.type, connection?.effectiveType].filter(Boolean).join("/");
  return hint ? hint.slice(0, 40) : undefined;
}

/** Keeps the phone's screen on while connected; asked again after the tab comes back. */
function useScreenWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let released = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // Not allowed (battery saver, unsupported): the call works without it.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && !released) void request();
    };
    void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => undefined);
    };
  }, [active]);
}

/** In audio-only mode the other side's video isn't downloaded at all. */
function useAudioOnlySubscriptions(audioOnly: boolean) {
  const room = useRoomContext();
  const cameras = useTracks([Track.Source.Camera], { onlySubscribed: false });
  useEffect(() => {
    for (const ref of cameras) {
      if (ref.participant.isLocal) continue;
      if (ref.publication instanceof RemoteTrackPublication) ref.publication.setSubscribed(!audioOnly);
    }
  }, [audioOnly, cameras, room]);
}
