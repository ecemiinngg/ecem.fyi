"use client";

import { useEffect, useRef } from "react";

const VIDEO_SRC = "/videos/sky-loop.mp4";
const POSTER_SRC = "/images/sky-poster.jpg";

/** The clip stretches the video to 1.12x, so shifting it vertically never
 *  exposes an edge. Keep DRIFT_PX well inside that headroom. */
const SCALE = 1.12;
const DRIFT_PX = 26;

/** The source clip runs a full day -> sunset -> night cycle in 10s, which is
 *  far too busy behind text. Quartering it gives a calm ~40s cycle. */
const PLAYBACK_RATE = 0.25;

/** How quickly the drift catches up to the pointer each frame (0-1). Low
 *  values read as floating rather than tracking. */
const EASE = 0.06;

export default function SkyBackground() {
  const parallaxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const parallax = parallaxRef.current;
    const video = videoRef.current;
    if (!parallax || !video) return;

    const setRate = () => {
      video.playbackRate = PLAYBACK_RATE;
    };
    if (video.readyState >= 1) setRate();
    video.addEventListener("loadedmetadata", setRate);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      video.pause();
      return () => video.removeEventListener("loadedmetadata", setRate);
    }

    // Transient pointer position lives in refs, never state — this updates far
    // too often to re-render on, and nothing renders from it.
    let targetY = 0;
    let currentY = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const frac = Math.max(0, Math.min(1, e.clientY / window.innerHeight));
      // Invert so the scene rises as the pointer drops — it reads as the cloud
      // drifting toward the cursor rather than away from it.
      targetY = (0.5 - frac) * 2 * DRIFT_PX;
    };

    // rAF-coalesced: many pointermove events collapse into one write per frame.
    const tick = () => {
      currentY += (targetY - currentY) * EASE;
      parallax.style.transform = `translate3d(0, ${currentY.toFixed(2)}px, 0) scale(${SCALE})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      video.removeEventListener("loadedmetadata", setRate);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* Outer layer owns the CSS idle bob. The parallax child owns the JS
          transform — an inline transform would otherwise kill the keyframe. */}
      <div className="sky-bob absolute inset-0">
        <div
          ref={parallaxRef}
          className="absolute inset-0"
          style={{ transform: `translate3d(0, 0, 0) scale(${SCALE})` }}
        >
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            poster={POSTER_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
            style={{ filter: "brightness(0.45) saturate(0.85)" }}
          />
        </div>
      </div>
      <div className="sky-scrim absolute inset-0" />
    </div>
  );
}
