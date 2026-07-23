"use client";

import { useEffect, useState, type ReactNode } from "react";
import IceTowerIntro from "./ice-tower-intro";

const STORAGE_KEY = "ecemfyi-intro-seen";

export default function SiteGate({ children }: { children: ReactNode }) {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(STORAGE_KEY)) {
        setShowIntro(true);
      }
    } catch {
      // sessionStorage unavailable (privacy mode etc.) — skip the intro
    }
  }, []);

  function finishIntro() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setShowIntro(false);
  }

  return (
    <>
      {children}
      {showIntro && <IceTowerIntro onFinish={finishIntro} />}
    </>
  );
}
