"use client";

import React, { useEffect, useRef } from "react";
import MuxPlayer from "@mux/mux-player-react";

type Props = {
  playbackId: string;
  title?: string;
  streamType?: "live" | "on-demand";
};

export default function MuxVideoPlayer({
  playbackId,
  title = "Video",
  streamType = "on-demand",
}: Props) {
  const ref = useRef<any>(null);

  useEffect(() => {
    const player = ref.current;
    if (!player) return;

    try {
      player.controls = true;
    } catch {}

    try {
      player.playsInline = true;
    } catch {}

    try {
      player.muted = true;
    } catch {}

    if (streamType !== "live") return;

    let didInitialJump = false;

    const getLiveEdge = () => {
      try {
        if (
          typeof player.seekable?.length === "number" &&
          player.seekable.length > 0
        ) {
          return player.seekable.end(player.seekable.length - 1);
        }
      } catch {}

      return null;
    };

    const jumpNearLiveEdgeOnce = () => {
      if (didInitialJump) return;

      try {
        const liveEdge = getLiveEdge();
        if (liveEdge == null) return;

        const target = Math.max(0, liveEdge - 2);
        if (Number.isFinite(target)) {
          player.currentTime = target;
          didInitialJump = true;
        }
      } catch {}
    };

    const syncIfFarBehind = () => {
      try {
        const liveEdge = getLiveEdge();
        if (liveEdge == null) return;

        const current = Number(player.currentTime ?? 0);
        const drift = liveEdge - current;

        // Nur eingreifen, wenn der Player wirklich weit hinterher ist
        if (Number.isFinite(drift) && drift > 12) {
          const target = Math.max(0, liveEdge - 3);
          player.currentTime = target;
        }
      } catch {}
    };

    const onLoadedMetadata = () => {
      jumpNearLiveEdgeOnce();
    };

    const onCanPlay = () => {
      jumpNearLiveEdgeOnce();
    };

    const onPlaying = () => {
      if (!didInitialJump) {
        jumpNearLiveEdgeOnce();
      }
    };

    player.addEventListener?.("loadedmetadata", onLoadedMetadata);
    player.addEventListener?.("canplay", onCanPlay);
    player.addEventListener?.("playing", onPlaying);

    const interval = window.setInterval(syncIfFarBehind, 5000);

    return () => {
      window.clearInterval(interval);
      player.removeEventListener?.("loadedmetadata", onLoadedMetadata);
      player.removeEventListener?.("canplay", onCanPlay);
      player.removeEventListener?.("playing", onPlaying);
    };
  }, [playbackId, streamType]);

  if (!playbackId?.trim()) return null;

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-black shadow">
      <MuxPlayer
        ref={ref}
        playbackId={playbackId}
        metadata={{ video_title: title }}
        streamType={streamType}
        autoPlay
        muted
        preferPlayback="mse"
        style={{ width: "100%", aspectRatio: "16/9", display: "block" }}
      />
    </div>
  );
}