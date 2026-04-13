"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Hls from "hls.js";

type Props = {
  src: string;
  autoPlay?: boolean;
  muted?: boolean;
  mode?: "live" | "vod" | "auto";
};

function isM3U8(url: string) {
  return /\.m3u8(\?|#|$)/i.test(url);
}

export default function VideoPlayer({
  src,
  autoPlay = true,
  muted = true,
  mode = "auto",
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastSrcRef = useRef<string>("");

  const lastJumpRef = useRef(0);
  const [error, setError] = useState("");
  const [isLiveDetected, setIsLiveDetected] = useState(mode === "live");

  const isHls = useMemo(() => !!src && isM3U8(src), [src]);

  const resolvedMode: "live" | "vod" = useMemo(() => {
    if (mode === "live") return "live";
    if (mode === "vod") return "vod";
    return isLiveDetected ? "live" : "vod";
  }, [mode, isLiveDetected]);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }
  }, []);

  const resetVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.pause();
    } catch {}

    try {
      video.removeAttribute("src");
      video.load();
    } catch {}
  }, []);

  const cleanupAll = useCallback(() => {
    destroyHls();
    resetVideo();
  }, [destroyHls, resetVideo]);

  const safePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !autoPlay) return;

    const p = video.play();
    if (p) p.catch(() => {});
  }, [autoPlay]);

  const jumpToLiveEdge = useCallback(
    (force = false) => {
      const video = videoRef.current;
      const hls = hlsRef.current;
      if (!video) return;

      const now = Date.now();
      if (!force && now - lastJumpRef.current < 3000) return;

      let target: number | null = null;

      const liveSyncPosition =
        (hls as any)?.liveSyncPosition ??
        (hls as any)?.latencyController?.liveSyncPosition ??
        null;

      if (typeof liveSyncPosition === "number" && Number.isFinite(liveSyncPosition)) {
        target = liveSyncPosition;
      } else if (video.buffered && video.buffered.length > 0) {
        const end = video.buffered.end(video.buffered.length - 1);
        if (Number.isFinite(end)) {
          target = Math.max(0, end - 0.4);
        }
      }

      if (target == null || !Number.isFinite(target)) return;

      try {
        const diff = Math.abs(video.currentTime - target);
        if (force || diff > 2) {
          video.currentTime = target;
          lastJumpRef.current = now;
        }
      } catch {}

      safePlay();
    },
    [safePlay]
  );

  useEffect(() => {
    setError("");
    setIsLiveDetected(mode === "live");

    const video = videoRef.current;
    if (!video) return;

    if (!src) {
      cleanupAll();
      lastSrcRef.current = "";
      setError("Kein Video gefunden.");
      return;
    }

    if (lastSrcRef.current === src) {
      return;
    }

    lastSrcRef.current = src;
    cleanupAll();

    video.muted = !!muted;
    video.autoplay = !!autoPlay;
    video.playsInline = true;
    video.preload = "metadata";

    if (!isHls) {
      video.src = src;
      safePlay();
      return;
    }

    const wantLive = mode === "live";

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;

      const onLoadedMetadata = () => {
        if (wantLive) {
          setTimeout(() => jumpToLiveEdge(true), 300);
        } else {
          safePlay();
        }
      };

      const onProgress = () => {
        if (!wantLive) return;
        if (!video.buffered || !video.buffered.length) return;

        const end = video.buffered.end(video.buffered.length - 1);
        const behind = end - video.currentTime;

        if (behind > 3) {
          jumpToLiveEdge(false);
        }
      };

      const onError = () => {
        setError("Video konnte nicht geladen werden.");
      };

      video.addEventListener("loadedmetadata", onLoadedMetadata);
      video.addEventListener("progress", onProgress);
      video.addEventListener("error", onError);

      safePlay();

      return () => {
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("progress", onProgress);
        video.removeEventListener("error", onError);
      };
    }

    if (!Hls.isSupported()) {
      setError("HLS wird von diesem Browser nicht unterstützt.");
      return;
    }

    const hls = new Hls({
      enableWorker: true,
      capLevelToPlayerSize: true,
      lowLatencyMode: wantLive,

      backBufferLength: wantLive ? 8 : 90,
      maxBufferLength: wantLive ? 5 : 60,
      maxMaxBufferLength: wantLive ? 8 : 120,

      liveSyncDurationCount: wantLive ? 1 : undefined,
      liveMaxLatencyDurationCount: wantLive ? 3 : undefined,

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

    hls.on(Hls.Events.ERROR, (_evt, data) => {
      if (!data?.fatal) return;

      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        try {
          hls.startLoad();
          return;
        } catch {}
        setError("Netzwerkfehler beim Stream.");
        return;
      }

      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        try {
          hls.recoverMediaError();
          return;
        } catch {}
        setError("Media-Fehler beim Stream.");
        return;
      }

      setError("Stream konnte nicht geladen werden.");
    });

    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls.loadSource(src);
      hls.startLoad(-1);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      safePlay();
      if (wantLive) {
        setTimeout(() => jumpToLiveEdge(true), 350);
      }
    });

    hls.on(Hls.Events.LEVEL_LOADED, (_evt, data) => {
      const live = !!data?.details?.live;
      setIsLiveDetected(live);

      if (!wantLive || !live) return;

      setTimeout(() => {
        const videoEl = videoRef.current;
        if (!videoEl || !videoEl.buffered || !videoEl.buffered.length) return;

        const end = videoEl.buffered.end(videoEl.buffered.length - 1);
        const behind = end - videoEl.currentTime;

        if (behind > 3) {
          jumpToLiveEdge(false);
        }
      }, 100);
    });

    hls.attachMedia(video);

    return () => {
      destroyHls();
      const currentVideo = videoRef.current;
      if (currentVideo) {
        try {
          currentVideo.pause();
          currentVideo.removeAttribute("src");
          currentVideo.load();
        } catch {}
      }
    };
  }, [src, autoPlay, muted, mode, isHls, cleanupAll, destroyHls, jumpToLiveEdge, safePlay]);

  const showLiveUi = resolvedMode === "live";

  return (
    <div className="w-full">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow">
        {showLiveUi ? (
          <button
            type="button"
            onClick={() => jumpToLiveEdge(true)}
            className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold"
            title="Zur Live-Position springen"
          >
            🔴 LIVE
          </button>
        ) : null}

        <video
          ref={videoRef}
          controls
          playsInline
          autoPlay={autoPlay}
          muted={muted}
          preload="metadata"
          className="h-full w-full"
        />
      </div>

      {error ? (
        <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>
      ) : (
        <p className="mt-2 text-xs font-medium text-slate-500">
          Modus: {resolvedMode === "live" ? "Live erkannt" : "VOD erkannt"}
        </p>
      )}
    </div>
  );
}