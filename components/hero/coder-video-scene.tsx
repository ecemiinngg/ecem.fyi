"use client";

import { useEffect, useRef } from "react";

const VIDEO_SRC = "/videos/sagadonus.mp4";
const NEUTRAL_TIME = 0.04;
const PEAK_TIME = 5.0;
const ANGRY_MS = 5000;

// Crop window inside the 1280x720 source video that contains the
// character + desk composition.
const CROP = { left: 15, top: 10, width: 1250, height: 700 };

// Hover box (fractions of the crop) tightly wrapping just the character's
// body (head/torso/arms), not the monitor/desk, measured from the source
// frames. Assumes the unmirrored (mouse-left) orientation; flipped
// horizontally when the mirrored (mouse-right) pose is showing.
const HOVER_BOX = { left: 0.13, top: 0.1, right: 0.43, bottom: 0.85 };

function isSkyPixel(r: number, g: number, b: number) {
  return b - r > 60 && b > 140 && g > 120;
}

export default function CoderVideoScene() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const angryRef = useRef(false);
  const angryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const overlay = overlayRef.current;
    if (!video || !canvas || !wrap || !overlay) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    canvas.width = CROP.width;
    canvas.height = CROP.height;

    let seeking = false;
    let queuedTime: number | null = null;
    let queuedMirror = false;
    let lastMirror = false;

    function drawFrame(mirror: boolean) {
      ctx!.save();
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      if (mirror) {
        ctx!.translate(canvas!.width, 0);
        ctx!.scale(-1, 1);
      }
      ctx!.drawImage(
        video!,
        CROP.left,
        CROP.top,
        CROP.width,
        CROP.height,
        0,
        0,
        canvas!.width,
        canvas!.height,
      );
      ctx!.restore();

      const frame = ctx!.getImageData(0, 0, canvas!.width, canvas!.height);
      const d = frame.data;
      for (let i = 0; i < d.length; i += 4) {
        if (isSkyPixel(d[i], d[i + 1], d[i + 2])) {
          d[i + 3] = 0;
        }
      }
      ctx!.putImageData(frame, 0, 0);
    }

    function requestFrame(time: number, mirror: boolean) {
      if (seeking) {
        queuedTime = time;
        queuedMirror = mirror;
        return;
      }
      seeking = true;
      lastMirror = mirror;
      video!.currentTime = time;
    }

    function onSeeked() {
      drawFrame(lastMirror);
      seeking = false;
      if (queuedTime !== null) {
        const t = queuedTime;
        const m = queuedMirror;
        queuedTime = null;
        requestFrame(t, m);
      }
    }
    video.addEventListener("seeked", onSeeked);

    function onReady() {
      video!.pause();
      requestFrame(NEUTRAL_TIME, false);
    }
    if (video.readyState >= 2) onReady();
    else video.addEventListener("loadeddata", onReady, { once: true });

    const onMove = (e: PointerEvent) => {
      const frac = Math.max(0, Math.min(1, e.clientX / window.innerWidth));
      const tilt = (frac - 0.5) * 2;
      const amount = Math.min(1, Math.abs(tilt) * 1.4);
      const time = NEUTRAL_TIME + amount * (PEAK_TIME - NEUTRAL_TIME);
      const mirror = tilt > 0;
      requestFrame(time, mirror);

      const rect = wrap!.getBoundingClientRect();
      const localX = (e.clientX - rect.left) / rect.width;
      const localY = (e.clientY - rect.top) / rect.height;
      // The hover box is measured for the unmirrored pose; flip it
      // horizontally when the mirrored (mouse-right) pose is being drawn.
      const box = mirror
        ? { left: 1 - HOVER_BOX.right, right: 1 - HOVER_BOX.left, top: HOVER_BOX.top, bottom: HOVER_BOX.bottom }
        : HOVER_BOX;
      const overCharacter =
        localX > box.left &&
        localX < box.right &&
        localY > box.top &&
        localY < box.bottom;

      if (overCharacter && !angryRef.current) {
        angryRef.current = true;
        overlay!.classList.add("coder-angry");
        canvas.classList.add("coder-canvas-angry");
        wrap!.classList.add("coder-shake");
        setTimeout(() => wrap!.classList.remove("coder-shake"), 600);
        window.dispatchEvent(new CustomEvent("coder-angry-start"));
        if (angryTimerRef.current) clearTimeout(angryTimerRef.current);
        angryTimerRef.current = setTimeout(() => {
          angryRef.current = false;
          overlay!.classList.remove("coder-angry");
          canvas.classList.remove("coder-canvas-angry");
        }, ANGRY_MS);
      }
    };

    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("loadeddata", onReady);
      if (angryTimerRef.current) clearTimeout(angryTimerRef.current);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="coder-float relative w-full"
      style={{ aspectRatio: `${CROP.width} / ${CROP.height}` }}
    >
      <div className="coder-ground" aria-hidden />
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        style={{ display: "none" }}
      />
      <canvas
        ref={canvasRef}
        aria-label="Pixel art illustration of Ecem at her desk"
        className="absolute inset-0 h-full w-full transition-[filter] duration-300"
        style={{ imageRendering: "pixelated" }}
      />
      <div
        ref={overlayRef}
        className="coder-overlay pointer-events-none absolute inset-0"
      />
    </div>
  );
}
