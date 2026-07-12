/**
 * Checks whether a username belongs to a real (premium/"non-cracked")
 * Minecraft account, so we know whether to trust a skin-render service or
 * fall back to a generated placeholder instead of letting it silently show
 * the default Steve skin.
 *
 * On network failure or timeout we fail OPEN (report the account as real) so
 * a transient Mojang API hiccup never wrongly replaces a real player's skin
 * with a placeholder — worst case, that one lookup just doesn't get the fix
 * applied and behaves like before.
 */
export async function mojangAccountExists(username: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.status === 404) return false;
    if (response.status !== 200) return true; // rate-limited, 5xx, blocked network, etc: fail open

    const data = await response.json().catch(() => null);
    return Boolean(data && typeof (data as { id?: unknown }).id === "string");
  } catch {
    return true;
  }
}
