export const PLAYABLE_EMBED_SLUGS = new Set([
  "battle-city-tank-game",
  "fitai-virtual-try-on",
]);

export function hasPlayableEmbed(slug: string) {
  return PLAYABLE_EMBED_SLUGS.has(slug);
}
