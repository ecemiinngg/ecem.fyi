"use client";

import { useEffect, useRef } from "react";

const DURATION_MS = 5000;
const CUP_COUNT = 26;
const DROPLET_COUNT = 40;
const BLOB_COUNT = 5;
const DROPLET_SPRITES = ["/images/coffee-drop-1.png", "/images/coffee-drop-2.png"];

export default function CoffeeSplashOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const onAngry = () => spawnSplash(overlay);
    window.addEventListener("coder-angry-start", onAngry);
    return () => window.removeEventListener("coder-angry-start", onAngry);
  }, []);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-[200] overflow-hidden"
      aria-hidden
    />
  );
}

function spawnSplash(overlay: HTMLDivElement) {
  const w = window.innerWidth;
  const h = window.innerHeight;

  for (let i = 0; i < CUP_COUNT; i++) {
    const cup = document.createElement("span");
    cup.textContent = "☕";
    cup.className = "splash-cup";
    const startX = Math.random() * w;
    const startY = h * (0.15 + Math.random() * 0.5);
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * (Math.min(w, h) * 0.35);
    cup.style.left = `${startX}px`;
    cup.style.top = `${startY}px`;
    cup.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
    cup.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
    cup.style.setProperty("--rot", `${(Math.random() - 0.5) * 720}deg`);
    cup.style.fontSize = `${18 + Math.random() * 16}px`;
    cup.style.animationDuration = `${1.8 + Math.random() * 2.4}s`;
    cup.style.animationDelay = `${Math.random() * 1.6}s`;
    overlay.appendChild(cup);
    cup.addEventListener("animationend", () => cup.remove());
    setTimeout(() => cup.remove(), DURATION_MS + 500);
  }

  for (let i = 0; i < DROPLET_COUNT; i++) {
    const drop = document.createElement("img");
    drop.src = DROPLET_SPRITES[i % DROPLET_SPRITES.length];
    drop.className = "splash-droplet";
    const startX = Math.random() * w;
    const startY = h * (0.1 + Math.random() * 0.6);
    const fallDist = h * (0.3 + Math.random() * 0.5);
    const drift = (Math.random() - 0.5) * 160;
    drop.style.left = `${startX}px`;
    drop.style.top = `${startY}px`;
    drop.style.setProperty("--fall", `${fallDist}px`);
    drop.style.setProperty("--drift", `${drift}px`);
    const size = 6 + Math.random() * 6;
    drop.style.width = `${size}px`;
    drop.style.setProperty("--rot0", `${(Math.random() - 0.5) * 50}deg`);
    drop.style.animationDuration = `${1 + Math.random() * 1.8}s`;
    drop.style.animationDelay = `${Math.random() * 2.2}s`;
    overlay.appendChild(drop);
    drop.addEventListener("animationend", () => drop.remove());
    setTimeout(() => drop.remove(), DURATION_MS + 500);
  }

  for (let i = 0; i < BLOB_COUNT; i++) {
    const blob = document.createElement("img");
    blob.src = "/images/coffee-splash-swirl.png";
    blob.className = "splash-blob";
    const size = 200 + Math.random() * 220;
    const cx = w * (0.2 + Math.random() * 0.6);
    const cy = h * (0.15 + Math.random() * 0.5);
    blob.style.left = `${cx - size / 2}px`;
    blob.style.top = `${cy - size / 2}px`;
    blob.style.width = `${size}px`;
    blob.style.setProperty("--rot0", `${Math.random() * 360}deg`);
    blob.style.animationDuration = `${2.2 + Math.random() * 0.8}s`;
    blob.style.animationDelay = `${0.5 + Math.random() * 0.9}s`;
    overlay.appendChild(blob);
    blob.addEventListener("animationend", () => blob.remove());
    setTimeout(() => blob.remove(), DURATION_MS + 500);
  }
}
