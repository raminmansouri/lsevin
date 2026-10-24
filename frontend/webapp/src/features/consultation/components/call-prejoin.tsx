"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMediaDevices, usePreviewTracks } from "@livekit/components-react";
import {
  createAudioAnalyser,
  LocalAudioTrack,
  LocalVideoTrack,
  MediaDeviceFailure,
} from "livekit-client";
import { ChevronLeft, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/** What the person picked before joining. */
export type CallChoices = {
  audioEnabled: boolean;
  videoEnabled: boolean;
  audioDeviceId: string;
  videoDeviceId: string;
};

/**
 * The check before joining: your own picture, a live microphone level and the
 * camera and microphone to use. Most call problems show up here, not with the
 * doctor waiting.
 */
export function CallPreJoin({
  onJoin,
  onBack,
}: {
  onJoin: (choices: CallChoices) => void;
  onBack: () => void;
}) {
  const t = useTranslations("Consultation.call");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioDeviceId, setAudioDeviceId] = useState("");
  const [videoDeviceId, setVideoDeviceId] = useState("");
  const [problem, setProblem] = useState<"permission" | "device" | null>(null);

  // A new object each render would restart the preview every render.
  const trackOptions = useMemo(
    () => ({
      audio: audioEnabled ? { deviceId: audioDeviceId || undefined } : false,
      video: videoEnabled ? { deviceId: videoDeviceId || undefined } : false,
    }),
    [audioEnabled, videoEnabled, audioDeviceId, videoDeviceId]
  );
  const tracks = usePreviewTracks(trackOptions, (error) => {
    setProblem(MediaDeviceFailure.getFailure(error) === MediaDeviceFailure.PermissionDenied ? "permission" : "device");
  });
  const videoTrack = tracks?.find((track): track is LocalVideoTrack => track instanceof LocalVideoTrack);
  const audioTrack = tracks?.find((track): track is LocalAudioTrack => track instanceof LocalAudioTrack);

  // Device names only appear once the browser has been given access.
  const cameras = useMediaDevices({ kind: "videoinput" });
  const microphones = useMediaDevices({ kind: "audioinput" });

  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = videoRef.current;
    if (!element || !videoTrack) return;
    videoTrack.attach(element);
    return () => {
      videoTrack.detach(element);
    };
  }, [videoTrack]);

  const level = useMicLevel(audioTrack);

  useEffect(() => {
    if (tracks?.length) setProblem(null);
  }, [tracks]);

  return (
    <div className="flex flex-1 flex-col px-5 pt-5">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl bg-white/5 sm:aspect-video sm:max-w-xl">
        {videoEnabled && videoTrack ? (
          <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100 object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-white/60">
            <VideoOff className="h-8 w-8" aria-hidden />
            <p className="mt-2 text-sm">{t("prejoin.cameraOff")}</p>
          </div>
        )}
        <div className="absolute inset-x-4 bottom-4 flex items-center gap-2" aria-label={t("prejoin.micLevel")}>
          {audioEnabled ? <Mic className="h-4 w-4 shrink-0" aria-hidden /> : <MicOff className="h-4 w-4 shrink-0" aria-hidden />}
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-emerald-400 transition-[width] duration-100"
              style={{ width: `${audioEnabled ? Math.min(100, Math.round(level * 250)) : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 w-full max-w-sm space-y-3 sm:max-w-xl">
        <p className="text-center text-sm text-white/70">{t("prejoin.hint")}</p>
        {problem && (
          <p className="rounded-2xl bg-red-500/15 p-3 text-center text-xs text-red-200">{t(`notice.${problem}`)}</p>
        )}

        <DeviceRow
          on={videoEnabled}
          onToggle={() => setVideoEnabled((value) => !value)}
          iconOn={<Video className="h-5 w-5" />}
          iconOff={<VideoOff className="h-5 w-5" />}
          toggleLabel={videoEnabled ? t("cameraOffButton") : t("cameraOnButton")}
          devices={cameras}
          selected={videoDeviceId || videoTrack?.mediaStreamTrack.getSettings().deviceId || ""}
          onSelect={setVideoDeviceId}
          fallbackName={(n) => t("prejoin.cameraName", { n })}
          label={t("prejoin.camera")}
        />
        <DeviceRow
          on={audioEnabled}
          onToggle={() => setAudioEnabled((value) => !value)}
          iconOn={<Mic className="h-5 w-5" />}
          iconOff={<MicOff className="h-5 w-5" />}
          toggleLabel={audioEnabled ? t("muteMic") : t("unmuteMic")}
          devices={microphones}
          selected={audioDeviceId || audioTrack?.mediaStreamTrack.getSettings().deviceId || ""}
          onSelect={setAudioDeviceId}
          fallbackName={(n) => t("prejoin.micName", { n })}
          label={t("prejoin.microphone")}
        />

        <div className="flex gap-3 pb-6 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-1 rounded-2xl bg-white/10 px-4 py-3 text-sm"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            {t("prejoin.back")}
          </button>
          <button
            type="button"
            onClick={() => onJoin({ audioEnabled, videoEnabled, audioDeviceId, videoDeviceId })}
            className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-bold"
          >
            {t("prejoin.join")}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeviceRow({
  on,
  onToggle,
  iconOn,
  iconOff,
  toggleLabel,
  devices,
  selected,
  onSelect,
  fallbackName,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
  toggleLabel: string;
  devices: MediaDeviceInfo[];
  selected: string;
  onSelect: (deviceId: string) => void;
  fallbackName: (n: number) => string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={toggleLabel}
        title={toggleLabel}
        onClick={onToggle}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full",
          on ? "bg-white/15 text-white" : "bg-white text-gray-900"
        )}
      >
        {on ? iconOn : iconOff}
      </button>
      <select
        aria-label={label}
        value={selected}
        disabled={!on || devices.length === 0}
        onChange={(event) => onSelect(event.target.value)}
        className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-white disabled:opacity-50"
      >
        {devices.length === 0 && <option value="">{label}</option>}
        {devices.map((device, index) => (
          <option key={device.deviceId} value={device.deviceId} className="text-gray-900">
            {device.label || fallbackName(index + 1)}
          </option>
        ))}
      </select>
    </div>
  );
}

/** The microphone's loudness, 0 to 1, refreshed ten times a second. */
function useMicLevel(track: LocalAudioTrack | undefined): number {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!track) {
      setLevel(0);
      return;
    }
    const { calculateVolume, cleanup } = createAudioAnalyser(track, { cloneTrack: true });
    const timer = window.setInterval(() => setLevel(calculateVolume()), 100);
    return () => {
      window.clearInterval(timer);
      void cleanup();
    };
  }, [track]);
  return level;
}
