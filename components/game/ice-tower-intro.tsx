"use client";

import { useEffect, useRef, useState } from "react";
import {
  TOWER,
  drawIceBackground,
  drawIceWalls,
  drawIceSpike,
  drawIceCharacter,
  drawIceFlag,
} from "@/components/game/ice-tower-render";

const W = 320;
const H = 420;
const ANCHOR_Y = H * 0.6;
const JUMP_MS = 280;

type Side = "left" | "right";
type Phase = "playing" | "dead" | "won";

const SPIKES: (Side | "none")[] = [
  "none",
  "none",
  "right",
  "left",
  "right",
  "none",
  "left",
  "right",
  "left",
  "none",
];
const WIN_RUNG = SPIKES.length;

export default function IceTowerIntro({ onFinish }: { onFinish: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("playing");
  const phaseRef = useRef<Phase>("playing");
  const rungRef = useRef(0);
  const sideRef = useRef<Side>("left");
  const animRef = useRef<{
    fromSide: Side;
    toSide: Side;
    fromRung: number;
    toRung: number;
    start: number;
  } | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const context = canvasEl.getContext("2d");
    if (!context) return;
    const ctx = context;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;

    const endGame = (result: "dead" | "won") => {
      if (phaseRef.current !== "playing") return;
      phaseRef.current = result;
      setPhase(result);
      finishTimerRef.current = setTimeout(onFinish, 1400);
    };

    const jumpTo = (target: Side) => {
      if (phaseRef.current !== "playing" || animRef.current) return;
      const fromRung = rungRef.current;
      const toRung = fromRung + 1;
      animRef.current = {
        fromSide: sideRef.current,
        toSide: target,
        fromRung,
        toRung,
        start: performance.now(),
      };
    };

    const onKey = (e: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A"].includes(e.key)) jumpTo("left");
      if (["ArrowRight", "d", "D"].includes(e.key)) jumpTo("right");
    };
    window.addEventListener("keydown", onKey);

    const draw = () => {
      let charSide: Side = sideRef.current;
      let charRung = rungRef.current;
      let beatT = 1;
      let arc = 0;

      const anim = animRef.current;
      if (anim) {
        const elapsed = performance.now() - anim.start;
        beatT = Math.min(1, elapsed / JUMP_MS);
        arc = Math.sin(beatT * Math.PI) * 30;
        charSide = beatT < 1 ? anim.fromSide : anim.toSide;
        charRung = anim.fromRung + (anim.toRung - anim.fromRung) * beatT;

        if (beatT >= 1) {
          const landedRung = anim.toRung;
          const landedSide = anim.toSide;
          sideRef.current = landedSide;
          rungRef.current = landedRung;
          animRef.current = null;

          if (landedRung >= WIN_RUNG) {
            endGame("won");
          } else if (SPIKES[landedRung] === landedSide) {
            endGame("dead");
          }
        }
      }

      const wallW = W * TOWER.wallFrac;
      const charX = charSide === "left" ? wallW * 0.58 : W - wallW * 0.58;
      const charWorldY = -charRung * TOWER.rungHeight;
      const camOffset = charWorldY - ANCHOR_Y;

      ctx.clearRect(0, 0, W, H);
      drawIceBackground(ctx, W, H, -camOffset);
      drawIceWalls(ctx, W, H, -camOffset);

      for (let r = 0; r < SPIKES.length; r++) {
        const spike = SPIKES[r];
        if (spike === "none") continue;
        const worldY = -r * TOWER.rungHeight;
        const screenY = worldY - camOffset;
        if (screenY < -30 || screenY > H + 30) continue;
        drawIceSpike(
          ctx,
          spike === "left" ? 0 : W - wallW,
          wallW,
          screenY,
          spike,
          1.1
        );
      }

      const flagWorldY = -WIN_RUNG * TOWER.rungHeight;
      const flagScreenY = flagWorldY - camOffset;
      const flagSide: Side = sideRef.current;
      drawIceFlag(
        ctx,
        flagSide === "left" ? wallW * 0.5 : W - wallW * 0.5,
        flagScreenY,
        wallW
      );

      const facing = charSide === "left" ? -1 : 1;
      drawIceCharacter(
        ctx,
        charX,
        ANCHOR_Y - arc,
        1.15,
        facing,
        beatT > 0.85 ? (beatT - 0.85) / 0.15 : 0
      );

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    const canvas = canvasEl;
    (canvas as unknown as { __jumpTo?: (s: Side) => void }).__jumpTo = jumpTo;

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function press(side: Side) {
    const canvas = canvasRef.current as unknown as {
      __jumpTo?: (s: Side) => void;
    } | null;
    canvas?.__jumpTo?.(side);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-3 flex w-full max-w-sm items-center justify-between font-mono text-xs text-muted sm:text-sm">
        <span>♥ x1 &nbsp;·&nbsp; ← → to pick a wall</span>
        <button
          onClick={onFinish}
          className="pixel-press rounded-md border-2 border-foreground bg-background-alt px-4 py-1.5 text-foreground shadow-[3px_3px_0_rgba(0,0,0,0.4)]"
        >
          Skip →
        </button>
      </div>

      <div className="pixel-border relative w-full max-w-sm overflow-hidden rounded-md">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const half = (e.clientX - rect.left) / rect.width;
            press(half < 0.5 ? "left" : "right");
          }}
          className="block h-auto w-full cursor-pointer"
          style={{ imageRendering: "pixelated" }}
        />

        {phase !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
            <p className="font-display text-2xl text-foreground">
              {phase === "won" ? "SUMMIT!" : "OOPS!"}
            </p>
            <p className="text-sm text-muted">
              {phase === "won"
                ? "Loading ecem.fyi..."
                : "That's your one life — loading ecem.fyi..."}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 select-none">
        <button
          onClick={() => press("left")}
          className="pixel-press h-14 w-20 rounded-md border-2 border-foreground bg-background-alt text-lg text-foreground shadow-[3px_3px_0_rgba(0,0,0,0.4)]"
        >
          ←
        </button>
        <button
          onClick={() => press("right")}
          className="pixel-press h-14 w-20 rounded-md border-2 border-foreground bg-background-alt text-lg text-foreground shadow-[3px_3px_0_rgba(0,0,0,0.4)]"
        >
          →
        </button>
      </div>
    </div>
  );
}
