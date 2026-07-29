"use client";

import dynamic from "next/dynamic";

// Dynamically imported so a project page never bundles the embeds for the
// *other* playable projects — only the one actually rendered on that page.
const BattleCityGame = dynamic(() => import("./battle-city-game"), {
  ssr: false,
});
const VirtualTryOn = dynamic(() => import("./virtual-try-on"), {
  ssr: false,
});
const OlymposGame = dynamic(() => import("./olympos-game"), {
  ssr: false,
});

const PLAYABLE_EMBEDS: Record<string, () => React.ReactNode> = {
  "battle-city-tank-game": () => <BattleCityGame />,
  "olympos-social-network": () => <OlymposGame />,
  "fitai-virtual-try-on": () => (
    <div className="h-[720px] overflow-y-auto rounded-2xl border border-border">
      <VirtualTryOn />
    </div>
  ),
};

export default function PlayableEmbed({ slug }: { slug: string }) {
  const render = PLAYABLE_EMBEDS[slug];
  if (!render) return null;
  return <>{render()}</>;
}
