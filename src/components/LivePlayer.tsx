"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";

type Props = {
  playbackId: string;
  autoPlay?: boolean;
  muted?: boolean;
};

export default function LivePlayer({
  playbackId,
  autoPlay = true,
  muted = true,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const mountedSrcRef = useRef<string>("");
  const [error, setError] = useState<string>("");

  const src = useMemo(() => {
    const id = String(playbackId || "").trim();
    return id ? `https://stream.mux.com/${id}.m3u8` : "";
  }, [playbackId]);

  useEffect(() => {
    setError("");

    const video = videoRef.current;
    if (!video) return;

    video.autoplay = !!autoPlay;
    video.muted = !!muted;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.preload = "auto";

    if (mountedSrcRef.current === src) {
      if (autoPlay) {
        const p = video.play();
        if (p) p.catch(() => {});
      }
      return;
    }

    mountedSrcRef.current = src;

    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }

    try {
      video.pause();
      video.removeAttribute("src");
      video.load();
    } catch {}

    if (!src) {
      setError("Kein playbackId vorhanden.");
      return;
    }

    const canNativePlay = video.canPlayType("application/vnd.apple.mpegurl");
    if (canNativePlay) {
      video.src = src;

      if (autoPlay) {
        const p = video.play();
        if (p) p.catch(() => {});
      }

      return () => {
        try {
          video.pause();
          video.removeAttribute("src");
          video.load();
        } catch {}
      };
    }

    if (!Hls.isSupported()) {
      setError("HLS wird von diesem Browser nicht unterstützt.");
      return;
    }

    const hls = new Hls({
      lowLatencyMode: true,
      backBufferLength: 30,
      maxBufferLength: 10,
      maxMaxBufferLength: 20,
      liveSyncDurationCount: 1,
      liveMaxLatencyDurationCount: 3,
      enableWorker: true,
      manifestLoadingTimeOut: 20000,
      levelLoadingTimeOut: 20000,
      fragLoadingTimeOut: 20000,
      manifestLoadingMaxRetry: 6,
      levelLoadingMaxRetry: 6,
      fragLoadingMaxRetry: 6,
      manifestLoadingRetryDelay: 1000,
      levelLoadingRetryDelay: 1000,
      fragLoadingRetryDelay: 1000,
    } as any);

    hlsRef.current = hls;

    hls.attachMedia(video);

    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls.loadSource(src);
      hls.startLoad(-1);

      if (autoPlay) {
        const p = video.play();
        if (p) p.catch(() => {});
      }
    });

    hls.on(Hls.Events.ERROR, (_evt, data) => {
      if (!data) return;

      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            try {
              hls.startLoad();
            } catch {
              setError("Stream konnte nicht geladen werden (Netzwerkfehler).");
              hls.destroy();
              hlsRef.current = null;
            }
            break;

          case Hls.ErrorTypes.MEDIA_ERROR:
            try {
              hls.recoverMediaError();
            } catch {
              setError("Stream konnte nicht geladen werden (Media-Fehler).");
              hls.destroy();
              hlsRef.current = null;
            }
            break;

          default:
            setError("Stream konnte nicht geladen werden (fatal).");
            hls.destroy();
            hlsRef.current = null;
            break;
        }
      }
    });

    return () => {
      try {
        hls.destroy();
      } catch {}
      hlsRef.current = null;

      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch {}
    };
  }, [src, autoPlay, muted]);

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl bg-black shadow">
        <video
          ref={videoRef}
          className="h-auto w-full"
          controls
          playsInline
          autoPlay={autoPlay}
          muted={muted}
          crossOrigin="anonymous"
        />
      </div>

      {error ? (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      ) : (
        <p className="mt-2 break-all text-xs text-neutral-500">{src}</p>
      )}
    </div>
  );
}