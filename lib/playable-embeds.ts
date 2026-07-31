export const PLAYABLE_EMBED_SLUGS = new Set([
  "attribution-tycoon",
  "battle-city-tank-game",
  "fitai-virtual-try-on",
  "olympos-social-network",
  "rewrite-the-epic",
]);

export function hasPlayableEmbed(slug: string) {
  return PLAYABLE_EMBED_SLUGS.has(slug);
}
