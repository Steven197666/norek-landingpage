"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import PrimaryButton from "@/components/ui/PrimaryButton";

type AttemptLite = {
  id: string;
  status: string;
};

type Props = {
  token: string | null;
  alreadySubmitted?: boolean;
  attemptWindowOpen: boolean;
  adultOnly: boolean;
  isAdultAllowed: boolean;
  gatingNeeded: boolean;
  gatingOk: boolean;
  requiredSeconds: number;
  myAttempt: AttemptLite | null;
  onEnsureAttempt: () => Promise<AttemptLite | null>;
  onUploaded: () => Promise<void>;
  onError: (msg: string) => void;
  onInfo: (msg: string) => void;
  texts?: {
    verifiedRecordingTitle?: string;
    verifiedRecordingText?: string;
    participationClosed?: string;
    noRecordingYet?: string;
    ready?: string;
    minimumDuration10?: string;
    startRecording?: string;
  };
};

async function getErrorMessageFromResponse(res: Response): Promise<string> {
  const fallback = `Request fehlgeschlagen (${res.status})`;

  try {
    const clone = res.clone();
    const data = await clone.json();

    if (Array.isArray(data?.message)) {
      const joined = data.message.filter(Boolean).join(", ").trim();
      if (joined) return joined;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message.trim();
    }

    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
  } catch {}

  try {
    const txt = await res.text();
    if (txt?.trim()) return txt.trim();
  } catch {}

  return fallback;
}

async function readApi(resOrJson: any) {
  if (resOrJson && typeof resOrJson === "object" && typeof resOrJson.ok === "boolean") {
    const res = resOrJson as Response;

    if (!res.ok) {
      const msg = await getErrorMessageFromResponse(res);
      return { ok: false, status: res.status, json: null, errorText: msg };
    }

    const json = await res.json().catch(() => null);
    return { ok: true, status: res.status, json };
  }

  return { ok: true, status: 200, json: resOrJson };
}

function pickSupportedMimeType() {
  const list = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];

  for (const mime of list) {
    try {
      if ("MediaRecorder" in window && MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    } catch {}
  }

  return "";
}

export default function RecordedAttemptRecorder({
  token,
  alreadySubmitted = false,
  attemptWindowOpen,
  adultOnly,
  isAdultAllowed,
  gatingNeeded,
  gatingOk,
  requiredSeconds,
  myAttempt,
  onEnsureAttempt,
  onUploaded,
  onError,
  onInfo,
  texts,
}: Props) {
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordStartedAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState("");

  const submittedAlready = useMemo(() => {
    return alreadySubmitted || String(myAttempt?.status ?? "").toLowerCase() === "submitted";
  }, [alreadySubmitted, myAttempt?.status]);

  const processingNow = useMemo(() => {
    return String(myAttempt?.status ?? "").toLowerCase() === "processing";
  }, [myAttempt?.status]);

  const blockedReason = useMemo(() => {
    if (!token) return "Bitte logge dich ein, um teilzunehmen.";
    if (!attemptWindowOpen) {
      return texts?.participationClosed ?? "Teilnahme ist aktuell nicht offen.";
    }
    if (adultOnly && !isAdultAllowed) {
      return "Diese Challenge ist ab 18. Hinterlege zuerst dein Geburtsdatum im Profil.";
    }
    if (gatingNeeded && !gatingOk) {
      return "Bestätige zuerst links den Teilnahme-Hinweis.";
    }
    if (submittedAlready) {
      return "Dein Video wurde bereits gültig eingereicht.";
    }
    if (processingNow) {
      return "Dein Versuch wird gerade verarbeitet.";
    }
    return "";
  }, [
    token,
    attemptWindowOpen,
    adultOnly,
    isAdultAllowed,
    gatingNeeded,
    gatingOk,
    submittedAlready,
    processingNow,
    texts?.participationClosed,
  ]);

  useEffect(() => {
    return () => {
      try {
        if (timerRef.current) clearInterval(timerRef.current);
      } catch {}

      try {
        mediaRecorderRef.current?.stop();
      } catch {}

      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}

      try {
        if (liveVideoRef.current) {
          liveVideoRef.current.pause();
          liveVideoRef.current.srcObject = null;
        }
      } catch {}

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    const video = liveVideoRef.current;
    const stream = streamRef.current;

    if (!isRecording || !video || !stream) return;

    let cancelled = false;

    const bindPreview = async () => {
      try {
        video.srcObject = stream;
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.autoplay = true;

        await video.play().catch(() => {});
      } catch (e) {
        if (!cancelled) {
          console.error("Preview konnte nicht gestartet werden", e);
        }
      }
    };

    bindPreview();

    return () => {
      cancelled = true;
    };
  }, [isRecording]);

  function stopLivePreviewTracks() {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;

    if (liveVideoRef.current) {
      try {
        liveVideoRef.current.pause();
      } catch {}
      try {
        liveVideoRef.current.srcObject = null;
      } catch {}
    }
  }

  function resetLocalRecording() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setRecordedBlob(null);
    setPreviewUrl("");
    setRecordedSeconds(0);
    setLocalError("");
    onError("");
    onInfo("");
  }

  async function handleStartRecording() {
    if (alreadySubmitted) {
      const msg =
        "Dein Video wurde bereits gueltig eingereicht. Pro Teilnehmer ist in dieser Challenge nur eine gueltige Einreichung moeglich.";
      setLocalError(msg);
      onInfo(msg);
      return;
    }

    if (blockedReason) {
      setLocalError(blockedReason);
      onError(blockedReason);
      return;
    }

    try {
      setLocalError("");
      onError("");
      onInfo("");

      const ensured = myAttempt ?? (await onEnsureAttempt());
      if (!ensured?.id) {
        throw new Error("Attempt konnte nicht angelegt werden.");
      }

      resetLocalRecording();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const videoTracks = stream.getVideoTracks();
      if (!videoTracks.length) {
        throw new Error("Kamera konnte nicht gestartet werden.");
      }

      streamRef.current = stream;

      const mimeType = pickSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event: any) => {
        const msg =
          event?.error?.message ||
          "Während der Aufnahme ist ein Recorder-Fehler aufgetreten.";
        setLocalError(msg);
        onError(msg);
      };

      recorder.onstop = () => {
        try {
          if (timerRef.current) clearInterval(timerRef.current);
        } catch {}

        const startedAt = recordStartedAtRef.current ?? Date.now();
        const seconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });

        const url = URL.createObjectURL(blob);

        stopLivePreviewTracks();
        setRecordedBlob(blob);
        setPreviewUrl(url);
        setRecordedSeconds(seconds);
        setIsRecording(false);

        onInfo(
          `Aufnahme beendet (${seconds}s). Prüfe die Vorschau und reiche sie danach ein.`
        );
      };

      recordStartedAtRef.current = Date.now();
      setRecordedSeconds(0);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        const startedAt = recordStartedAtRef.current ?? Date.now();
        setRecordedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
      }, 250);

      recorder.start(1000);
    } catch (e: any) {
      stopLivePreviewTracks();
      setIsRecording(false);

      const msg =
        e?.message ||
        "Aufnahme konnte nicht gestartet werden. Prüfe Kamera- und Mikrofonrechte.";
      setLocalError(msg);
      onError(msg);
    }
  }

  function handleStopRecording() {
    try {
      if (!mediaRecorderRef.current) return;
      if (mediaRecorderRef.current.state === "inactive") return;

      mediaRecorderRef.current.stop();
    } catch (e: any) {
      const msg = e?.message || "Aufnahme konnte nicht gestoppt werden.";
      setLocalError(msg);
      onError(msg);
    }
  }

  function handleDiscardRecording() {
    try {
      if (isRecording) {
        mediaRecorderRef.current?.stop();
      }
    } catch {}

    stopLivePreviewTracks();
    resetLocalRecording();
  }

  async function handleUploadRecording() {
    if (alreadySubmitted) {
      const msg =
        "Dein Video wurde bereits gueltig eingereicht. Pro Teilnehmer ist in dieser Challenge nur eine gueltige Einreichung moeglich.";
      setLocalError(msg);
      onInfo(msg);
      return;
    }

    if (!token) {
      const msg = "Bitte logge dich ein.";
      setLocalError(msg);
      onError(msg);
      return;
    }

    if (!recordedBlob || !recordedSeconds) {
      const msg = "Es liegt noch keine fertige Aufnahme vor.";
      setLocalError(msg);
      onError(msg);
      return;
    }

    try {
      setUploading(true);
      setLocalError("");
      onError("");
      onInfo("");

      const ensured = myAttempt ?? (await onEnsureAttempt());
      if (!ensured?.id) {
        throw new Error("Attempt konnte nicht angelegt werden.");
      }

      const fileExt = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
      const file = new File([recordedBlob], `attempt-${ensured.id}.${fileExt}`, {
        type: recordedBlob.type || `video/${fileExt}`,
      });

      const form = new FormData();
      form.append("file", file);
      form.append("durationSeconds", String(recordedSeconds));

      const resOrJson = await apiFetch(
        `/attempts/${ensured.id}/recorded/upload`,
        {
          method: "POST",
          body: form,
        },
        true
      );

      const parsed = await readApi(resOrJson);
      if (!parsed.ok) {
        throw new Error(parsed.errorText || "Upload fehlgeschlagen");
      }

      onInfo("Aufnahme wurde erfolgreich eingereicht.");
      handleDiscardRecording();
      await onUploaded();
    } catch (e: any) {
      const msg = e?.message || "Upload fehlgeschlagen";
      setLocalError(msg);
      onError(msg);
    } finally {
      setUploading(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
        <div className="text-sm font-bold text-white">Login erforderlich</div>
        <div className="mt-1.5 text-sm leading-6 text-slate-300">
          Melde dich an, damit du deine verifizierte Aufnahme starten kannst.
        </div>
        <div className="mt-4">
          <Link href="/auth/login">
            <PrimaryButton variant="secondary">Login</PrimaryButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,18,33,0.94)_0%,rgba(8,15,28,0.88)_100%)] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
        <div className="text-base font-extrabold text-white">
          {texts?.verifiedRecordingTitle ?? "Verifizierte Aufnahme"}
        </div>
        <div className="mt-1.5 whitespace-pre-line text-sm leading-6 text-slate-300">
          {texts?.verifiedRecordingText ??
            "Nimm dein Video direkt in der App auf, prüfe die Vorschau und reiche es anschließend ein. Mindestdauer: 10s."}
        </div>

        {blockedReason && !isRecording && !recordedBlob ? (
          <div className="mt-4 rounded-[18px] border border-amber-400/20 bg-amber-500/[0.08] p-3 text-sm text-amber-100">
            {blockedReason}
          </div>
        ) : null}

        <div className="mt-4 grid gap-3">
          {submittedAlready ? (
            <div className="rounded-[18px] border border-emerald-400/20 bg-emerald-500/[0.08] p-4 text-sm text-emerald-200">
              <div className="font-extrabold">✅ Bereits eingereicht</div>
              <div className="mt-1.5 leading-6">
                Dein Video wurde bereits gültig eingereicht. Du kannst hier keine weitere Aufnahme
                mehr starten.
              </div>
            </div>
          ) : isRecording ? (
            <div className="overflow-hidden rounded-[22px] border border-red-400/20 bg-black shadow-[0_12px_30px_rgba(239,68,68,0.12)]">
              <video
                ref={liveVideoRef}
                className="aspect-video w-full object-cover"
                playsInline
                muted
                autoPlay
              />
            </div>
          ) : previewUrl ? (
            <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black">
              <video
                src={previewUrl}
                className="aspect-video w-full object-cover"
                controls
                playsInline
              />
            </div>
          ) : processingNow ? (
            <div className="rounded-[18px] border border-amber-400/20 bg-amber-500/[0.08] p-4 text-sm text-amber-100">
              <div className="font-extrabold">⏳ Verarbeitung läuft</div>
              <div className="mt-1.5 leading-6">
                Deine Aufnahme wurde hochgeladen und wird gerade verarbeitet. Bitte kurz warten.
              </div>
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-slate-400">
              {texts?.noRecordingYet ?? "Noch keine Aufnahme vorhanden."}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm">
            {submittedAlready ? (
              <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/[0.08] px-3 py-1 font-extrabold text-emerald-200">
                ✅ Gültig eingereicht
              </span>
            ) : processingNow ? (
              <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-500/[0.08] px-3 py-1 font-extrabold text-amber-100">
                ⏳ Wird verarbeitet
              </span>
            ) : isRecording ? (
              <span className="inline-flex rounded-full border border-red-400/20 bg-red-500/[0.08] px-3 py-1 font-extrabold text-red-200">
                🔴 Aufnahme läuft: {recordedSeconds}s
              </span>
            ) : recordedSeconds > 0 ? (
              <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/[0.08] px-3 py-1 font-extrabold text-cyan-200">
                🎬 Aufnahme fertig: {recordedSeconds}s
              </span>
            ) : (
              <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 font-extrabold text-slate-200">
                {texts?.ready ?? "Bereit"}
              </span>
            )}

            <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 font-bold text-slate-300">
              {texts?.minimumDuration10 ?? `Mindestdauer ${requiredSeconds}s`}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {!submittedAlready && !processingNow && !isRecording && !recordedBlob ? (
              <PrimaryButton
                type="button"
                variant="dark"
                onClick={handleStartRecording}
                disabled={!!blockedReason}
              >
                {texts?.startRecording ?? "Aufnahme starten"}
              </PrimaryButton>
            ) : null}

            {!submittedAlready && !processingNow && isRecording ? (
              <PrimaryButton
                type="button"
                variant="secondary"
                onClick={handleStopRecording}
              >
                ⏹ Aufnahme stoppen
              </PrimaryButton>
            ) : null}

            {!submittedAlready && !processingNow && !isRecording && recordedBlob ? (
              <>
                <PrimaryButton
                  type="button"
                  variant="secondary"
                  onClick={handleUploadRecording}
                  disabled={uploading}
                  loading={uploading}
                  loadingText="Reiche ein…"
                >
                  ✅ Aufnahme einreichen
                </PrimaryButton>

                <PrimaryButton
                  type="button"
                  variant="secondary"
                  onClick={handleDiscardRecording}
                  disabled={uploading}
                >
                  Verwerfen
                </PrimaryButton>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {localError ? (
        <div className="rounded-[18px] border border-red-400/20 bg-red-500/[0.08] p-4 text-sm text-red-200">
          <div className="font-extrabold">Fehler</div>
          <div className="mt-1.5">{localError}</div>
        </div>
      ) : null}
    </div>
  );
}