"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  AlertTriangle,
  Bug,
  Camera,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createBugReportAction } from "../actions";
import {
  AdminDiagnosticEntry,
  normalizeDiagnosticEntries,
  redactDiagnosticText,
} from "../admin-diagnostics";

type CaptureState =
  | "idle"
  | "capturing"
  | "captured"
  | "unavailable"
  | "denied";

const COPY = {
  en: {
    button: "Report a bug",
    title: "Report an admin issue",
    subtitle:
      "Describe the problem. A screenshot and safe diagnostic details will be attached.",
    issueTitle: "Short title",
    description: "What happened, and what were you trying to do?",
    severity: "Severity",
    screenshot: "Screenshot",
    captured: "Screenshot captured",
    capturing: "Choose this browser tab in the capture dialog",
    denied: "Screen capture was cancelled. You can retry or submit without it.",
    unavailable: "Screen capture is unavailable in this browser.",
    retry: "Capture again",
    remove: "Remove",
    cancel: "Cancel",
    submit: "Submit report",
    submitting: "Submitting…",
    success: "Bug report submitted",
  },
  fa: {
    button: "گزارش باگ",
    title: "گزارش مشکل پنل ادمین",
    subtitle:
      "مشکل را توضیح دهید. اسکرین‌شات و اطلاعات فنی امن به گزارش اضافه می‌شود.",
    issueTitle: "عنوان کوتاه",
    description: "چه اتفاقی افتاد و قصد انجام چه کاری را داشتید؟",
    severity: "شدت مشکل",
    screenshot: "اسکرین‌شات",
    captured: "اسکرین‌شات ثبت شد",
    capturing: "در پنجره بازشده همین تب مرورگر را انتخاب کنید",
    denied: "ثبت صفحه لغو شد. دوباره تلاش کنید یا گزارش را بدون تصویر بفرستید.",
    unavailable: "ثبت صفحه در این مرورگر در دسترس نیست.",
    retry: "ثبت دوباره",
    remove: "حذف تصویر",
    cancel: "انصراف",
    submit: "ارسال گزارش",
    submitting: "در حال ارسال…",
    success: "گزارش باگ ثبت شد",
  },
} as const;

function getLocale(): keyof typeof COPY {
  if (typeof document === "undefined") return "en";
  return document.documentElement.lang.toLowerCase().startsWith("fa")
    ? "fa"
    : "en";
}

function detectBrowserName() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Edg/")) return "Edge";
  if (userAgent.includes("Firefox/")) return "Firefox";
  if (userAgent.includes("Chrome/")) return "Chrome";
  if (userAgent.includes("Safari/")) return "Safari";
  return "Unknown";
}

async function captureCurrentScreen(): Promise<File> {
  if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("unavailable");
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });
  try {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    await video.play();
    await new Promise<void>((resolve) => {
      if (video.readyState >= 2) return resolve();
      video.onloadeddata = () => resolve();
    });
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context || !canvas.width || !canvas.height)
      throw new Error("unavailable");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    if (!blob) throw new Error("unavailable");
    return new File(
      [blob],
      `admin-bug-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`,
      {
        type: "image/jpeg",
      }
    );
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}

export function AdminBugReportFloatingButton() {
  const copy = COPY[getLocale()];
  const [open, setOpen] = useState(false);
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const diagnosticEntries = useRef<AdminDiagnosticEntry[]>([]);

  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...values: unknown[]) => {
      diagnosticEntries.current.push({
        level: "error",
        message: values.map(redactDiagnosticText).join(" "),
        source: "console.error",
        timestamp: new Date().toISOString(),
      });
      diagnosticEntries.current = diagnosticEntries.current.slice(-30);
      originalConsoleError(...values);
    };
    const onError = (event: ErrorEvent) => {
      diagnosticEntries.current.push({
        level: "error",
        message: redactDiagnosticText(event.error ?? event.message),
        source: event.filename || undefined,
        timestamp: new Date().toISOString(),
      });
      diagnosticEntries.current = diagnosticEntries.current.slice(-30);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      diagnosticEntries.current.push({
        level: "error",
        message: redactDiagnosticText(event.reason),
        source: "unhandledrejection",
        timestamp: new Date().toISOString(),
      });
      diagnosticEntries.current = diagnosticEntries.current.slice(-30);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      console.error = originalConsoleError;
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  useEffect(() => {
    if (!screenshot) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(screenshot);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [screenshot]);

  const capture = async () => {
    setCaptureState("capturing");
    setError(null);
    try {
      const file = await captureCurrentScreen();
      setScreenshot(file);
      setCaptureState("captured");
    } catch (captureError) {
      const unavailable =
        captureError instanceof Error && captureError.message === "unavailable";
      setCaptureState(unavailable ? "unavailable" : "denied");
    }
  };

  const openReporter = async () => {
    setSuccess(null);
    setError(null);
    await capture();
    setOpen(true);
  };

  const submit = (formData: FormData) => {
    setError(null);
    formData.set("sourceArea", "admin");
    formData.set("sourceUrl", window.location.href);
    formData.set("priority", "normal");
    formData.set("captureAdminDiagnostics", "true");
    formData.set("locale", document.documentElement.lang || "en");
    formData.set("browserName", detectBrowserName());
    formData.set("operatingSystem", navigator.platform || "unknown");
    formData.set(
      "deviceType",
      window.innerWidth < 768
        ? "mobile"
        : window.innerWidth < 1180
          ? "tablet"
          : "desktop"
    );
    formData.set(
      "environment",
      JSON.stringify({
        client: {
          capturedAt: new Date().toISOString(),
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          language: navigator.language,
          userAgent: navigator.userAgent.slice(0, 500),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          online: navigator.onLine,
        },
        applicationLogs: normalizeDiagnosticEntries(diagnosticEntries.current),
        screenshot: { state: captureState },
      })
    );
    if (screenshot) formData.append("files", screenshot);

    startTransition(async () => {
      const result = await createBugReportAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSuccess(`${copy.success}: ${result.data.reportNumber}`);
      setScreenshot(null);
      setCaptureState("idle");
    });
  };

  const captureMessage =
    captureState === "capturing"
      ? copy.capturing
      : captureState === "captured"
        ? copy.captured
        : captureState === "unavailable"
          ? copy.unavailable
          : captureState === "denied"
            ? copy.denied
            : null;

  return (
    <>
      <Button
        type="button"
        onClick={() => void openReporter()}
        className="fixed end-5 bottom-5 z-40 h-12 rounded-full bg-red-600 px-4 text-white shadow-xl hover:bg-red-700"
        aria-label={copy.button}
      >
        <Bug className="size-5" />
        <span className="hidden sm:inline">{copy.button}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="size-5 text-red-600" />
              {copy.title}
            </DialogTitle>
            <DialogDescription>{copy.subtitle}</DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="size-5" />
              {success}
            </div>
          ) : (
            <form action={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-bug-title">{copy.issueTitle}</Label>
                <Input
                  id="admin-bug-title"
                  name="title"
                  required
                  minLength={4}
                  maxLength={180}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-bug-description">
                  {copy.description}
                </Label>
                <Textarea
                  id="admin-bug-description"
                  name="description"
                  required
                  minLength={10}
                  maxLength={6000}
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-bug-severity">{copy.severity}</Label>
                <select
                  id="admin-bug-severity"
                  name="severity"
                  defaultValue="medium"
                  className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>{copy.screenshot}</Label>
                    {captureMessage ? (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {captureMessage}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    {screenshot ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setScreenshot(null);
                          setCaptureState("idle");
                        }}
                      >
                        {copy.remove}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void capture()}
                      disabled={captureState === "capturing"}
                    >
                      {captureState === "capturing" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      {copy.retry}
                    </Button>
                  </div>
                </div>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Captured admin screen"
                    className="mt-3 max-h-48 w-full rounded-md border object-contain"
                  />
                ) : null}
              </div>
              {error ? (
                <div
                  role="alert"
                  className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertTriangle className="size-5 shrink-0" />
                  {error}
                </div>
              ) : null}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  {copy.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Camera className="size-4" />
                  )}
                  {isPending ? copy.submitting : copy.submit}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
