import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthUser = {
  sub: string;
  username: string;
  role: "USER" | "TESTER" | "ADMIN";
  discordId?: string;
};

const jwtSecret = () => process.env.JWT_SECRET || "dev-secret-change-me";

export function signToken(user: AuthUser) {
  return jwt.sign(user, jwtSecret(), { expiresIn: "7d" });
}

export function requireAuth(roles: AuthUser["role"][] = []) {
  return (request: Request, response: Response, next: NextFunction) => {
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!token) {
      response.status(401).json({ error: "Missing bearer token" });
      return;
    }

    try {
      const user = jwt.verify(token, jwtSecret()) as AuthUser;
      if (roles.length > 0 && !roles.includes(user.role)) {
        response.status(403).json({ error: "Insufficient permissions" });
        return;
      }

      (request as Request & { user: AuthUser }).user = user;
      next();
    } catch {
      response.status(401).json({ error: "Invalid token" });
    }
  };
}

export function discordAuthUrl() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || "http://localhost:4000/auth/discord/callback";

  if (!clientId) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify guilds"
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeDiscordCode(code: string) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || "http://localhost:4000/auth/discord/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Discord OAuth is not configured");
  }

  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri
    })
  });

  if (!tokenResponse.ok) {
    throw new Error("Discord token exchange failed");
  }

  const token = (await tokenResponse.json()) as { access_token: string };
  const userResponse = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` }
  });

  if (!userResponse.ok) {
    throw new Error("Discord profile request failed");
  }

  return (await userResponse.json()) as {
    id: string;
    username: string;
    global_name?: string;
    avatar?: string;
  };
}
