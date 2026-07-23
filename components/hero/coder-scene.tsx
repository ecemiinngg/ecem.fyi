"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const ANGRY_MS = 5000;

// Bounding box of the isolated character (head+torso+arms) within the full
// 1792x2390 source image, as percentages — lines up exactly with the hole
// cut in coder-scene-bg.png.
const CHAR_BOX = {
  left: (210 / 1792) * 100,
  top: (610 / 2390) * 100,
  width: (885 / 1792) * 100,
  height: (1180 / 2390) * 100,
};

const HOVER_BOX = {
  left: 210 / 1792,
  top: 610 / 2390,
  right: 1095 / 1792,
  bottom: 1790 / 2390,
};

// Face landmarks as percentages within the character crop (885x1180),
// sampled from the source art, used to place the angry-expression overlay.
const FACE = {
  browLeft: { left: 48.6, top: 19.9 },
  browRight: { left: 65.5, top: 19.5 },
  mouth: { left: 56.5, top: 33.5, width: 14, height: 4 },
};

export default function CoderScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const angryRef = useRef(false);
  const angryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const char = charRef.current;
    const overlay = overlayRef.current;
    const face = faceRef.current;
    if (!container || !char || !overlay || !face) return;

    const onMove = (e: PointerEvent) => {
      const frac = Math.max(0, Math.min(1, e.clientX / window.innerWidth));
      const tilt = (frac - 0.5) * 2;
      char.style.transform = `perspective(1100px) rotateY(${tilt * -26}deg) translateX(${tilt * 10}px)`;

      const rect = container.getBoundingClientRect();
      const localX = (e.clientX - rect.left) / rect.width;
      const localY = (e.clientY - rect.top) / rect.height;
      const overCharacter =
        localX > HOVER_BOX.left &&
        localX < HOVER_BOX.right &&
        localY > HOVER_BOX.top &&
        localY < HOVER_BOX.bottom;

      if (overCharacter && !angryRef.current) {
        angryRef.current = true;
        overlay.classList.add("coder-angry");
        face.classList.add("coder-face-angry");
        char.classList.add("coder-shake");
        setTimeout(() => char.classList.remove("coder-shake"), 600);
        window.dispatchEvent(new CustomEvent("coder-angry-start"));
        if (angryTimerRef.current) clearTimeout(angryTimerRef.current);
        angryTimerRef.current = setTimeout(() => {
          angryRef.current = false;
          overlay.classList.remove("coder-angry");
          face.classList.remove("coder-face-angry");
        }, ANGRY_MS);
      }
    };

    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (angryTimerRef.current) clearTimeout(angryTimerRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative aspect-[3/4] w-full">
      <div className="coder-ground" aria-hidden />

      <div className="coder-float absolute inset-0">
        <Image
          src="/images/coder-scene-bg.png"
          alt="Pixel art illustration of Ecem's desk setup"
          fill
          sizes="280px"
          className="object-contain"
          priority
        />

        <div
          ref={charRef}
          className="absolute transition-transform duration-500 ease-out"
          style={{
            left: `${CHAR_BOX.left}%`,
            top: `${CHAR_BOX.top}%`,
            width: `${CHAR_BOX.width}%`,
            height: `${CHAR_BOX.height}%`,
            transformOrigin: "50% 96%",
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
          }}
        >
          <Image
            src="/images/coder-character.png"
            alt="Pixel art illustration of Ecem"
            fill
            sizes="180px"
            priority
            style={{ imageRendering: "pixelated" }}
          />

          <div ref={faceRef} className="coder-face pointer-events-none absolute inset-0" aria-hidden>
            <span
              className="coder-brow coder-brow-left"
              style={{ left: `${FACE.browLeft.left}%`, top: `${FACE.browLeft.top}%` }}
            />
            <span
              className="coder-brow coder-brow-right"
              style={{ left: `${FACE.browRight.left}%`, top: `${FACE.browRight.top}%` }}
            />
            <span
              className="coder-mouth-cover"
              style={{
                left: `${FACE.mouth.left}%`,
                top: `${FACE.mouth.top}%`,
                width: `${FACE.mouth.width}%`,
                height: `${FACE.mouth.height}%`,
              }}
            />
            <span
              className="coder-mouth-frown"
              style={{ left: `${FACE.mouth.left}%`, top: `${FACE.mouth.top}%` }}
            />
          </div>
        </div>
      </div>

      <div
        ref={overlayRef}
        className="coder-overlay pointer-events-none absolute inset-0"
      />
    </div>
  );
}
