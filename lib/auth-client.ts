const TOKEN_KEY = "tier_testing_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Decodes the role out of the stored JWT for UI purposes only (e.g. hiding the
 * Admin nav link, showing "access denied" instead of the panel). This is NOT a
 * security boundary — the token isn't signature-verified here, it's just base64
 * decoded. The actual enforcement happens server-side in server/auth.ts, which
 * verifies the signature and role on every admin-only request.
 */
export function getStoredRole(): "USER" | "TESTER" | "ADMIN" | null {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.role ?? null;
  } catch {
    return null;
  }
}

export function authHeader(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
