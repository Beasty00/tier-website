/**
 * Deterministic placeholder head/body avatars for players whose Minecraft
 * account can't be resolved (cracked/offline usernames, or anything Mojang
 * doesn't recognize). Skin-render services like mc-heads.net silently fall
 * back to the vanilla Steve skin for unknown accounts, which looks like an
 * error state repeated across the whole leaderboard. Instead we generate a
 * small blocky SVG avatar, colored deterministically from the username, so
 * every unresolved account gets a distinct (but stable) look that is clearly
 * not Steve or Alex.
 *
 * Pure string/SVG generation only — no Buffer, no DOM — so this file is safe
 * to import from both server code and React components.
 */

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Deliberately avoids Steve's tan/blue and Alex's tan/orange palette.
const SKIN_TONES = ["#7dd3c0", "#f4a6c1", "#a78bfa", "#fbbf6b", "#93c5fd", "#f87171", "#6ee7b7", "#fcd34d"];
const ACCENT_TONES = ["#1f2937", "#7c3aed", "#0ea5e9", "#f472b6", "#22c55e", "#f59e0b", "#e11d48", "#0d9488"];

function paletteFor(username: string) {
  const hash = hashString(username.trim().toLowerCase());
  const skin = SKIN_TONES[hash % SKIN_TONES.length];
  const hair = ACCENT_TONES[Math.floor(hash / SKIN_TONES.length) % ACCENT_TONES.length];
  const shirt = ACCENT_TONES[Math.floor(hash / (SKIN_TONES.length * ACCENT_TONES.length)) % ACCENT_TONES.length];
  return { skin, hair, shirt };
}

export function placeholderHeadDataUri(username: string): string {
  const { skin, hair } = paletteFor(username);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" shape-rendering="crispEdges">
    <rect width="8" height="8" fill="${skin}"/>
    <rect x="0" y="0" width="8" height="2" fill="${hair}"/>
    <rect x="1" y="3" width="1" height="1" fill="#1a1a1a"/>
    <rect x="6" y="3" width="1" height="1" fill="#1a1a1a"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function placeholderBodyDataUri(username: string): string {
  const { skin, hair, shirt } = paletteFor(username);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 16" shape-rendering="crispEdges">
    <rect x="0" y="8" width="8" height="8" fill="${shirt}"/>
    <rect x="1" y="0" width="6" height="6" fill="${skin}"/>
    <rect x="1" y="0" width="6" height="2" fill="${hair}"/>
    <rect x="2" y="3" width="1" height="1" fill="#1a1a1a"/>
    <rect x="5" y="3" width="1" height="1" fill="#1a1a1a"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** True if a skin URL is one of our generated placeholders rather than a real skin render. */
export function isPlaceholderSkin(skin: string | undefined | null): boolean {
  return Boolean(skin && skin.startsWith("data:image/svg+xml"));
}
