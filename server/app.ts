import "dotenv/config";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { discordAuthUrl, exchangeDiscordCode, isAdminDiscordId, requireAuth, signToken } from "./auth";
import { databaseStatus } from "./db";
import {
  createGamemode,
  createPlayer,
  createTester,
  deleteGamemode,
  deletePlayer,
  deleteTester,
  getPlayer,
  getStats,
  joinQueue,
  leaveQueue,
  listCooldowns,
  listGamemodes,
  listPlayers,
  listQueue,
  listRegions,
  listTesters,
  listTiers,
  recordTest,
  updateGamemode,
  updatePlayer,
  updateTester,
  verifyDiscord
} from "./store";

const app = express();
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: [siteUrl, "http://localhost:3000", "http://127.0.0.1:3000"], credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 180,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (request) => {
      const forwarded = request.headers["x-forwarded-for"];
      const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
      return first?.trim() || request.ip || "unknown";
    }
  })
);

function asyncRoute(handler: (request: Request, response: Response, next: NextFunction) => Promise<void> | void) {
  return (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

app.get("/health", asyncRoute(async (_request, response) => {
  response.json({ ok: true, service: "tier-testing-api", database: await databaseStatus() });
}));

app.get("/auth/discord", (_request, response) => {
  const url = discordAuthUrl();
  if (!url) {
    response.status(400).json({ error: "Discord OAuth is not configured" });
    return;
  }
  response.redirect(url);
});

app.get("/auth/discord/callback", asyncRoute(async (request, response) => {
  const code = String(request.query.code || "");
  if (!code) {
    response.status(400).json({ error: "Missing Discord OAuth code" });
    return;
  }

  const discordUser = await exchangeDiscordCode(code);
  const token = signToken({
    sub: discordUser.id,
    username: discordUser.global_name || discordUser.username,
    role: isAdminDiscordId(discordUser.id) ? "ADMIN" : "USER",
    discordId: discordUser.id
  });

  response.redirect(`${siteUrl}/login?token=${encodeURIComponent(token)}`);
}));

app.post("/auth/verify", asyncRoute(async (request, response) => {
  response.status(201).json(await verifyDiscord(request.body));
}));

app.get("/players", asyncRoute(async (request, response) => {
  response.json(await listPlayers(request.query));
}));

app.get("/player/:id", asyncRoute(async (request, response) => {
  const player = await getPlayer(String(request.params.id));
  if (!player) {
    response.status(404).json({ error: "Player not found" });
    return;
  }
  response.json(player);
}));

app.post("/player", requireAuth(["ADMIN"]), asyncRoute(async (request, response) => {
  response.status(201).json(await createPlayer(request.body));
}));

app.put("/player/:id", requireAuth(["ADMIN"]), asyncRoute(async (request, response) => {
  const player = await updatePlayer(String(request.params.id), request.body);
  if (!player) {
    response.status(404).json({ error: "Player not found" });
    return;
  }
  response.json(player);
}));

app.delete("/player/:id", requireAuth(["ADMIN"]), asyncRoute(async (request, response) => {
  const removed = await deletePlayer(String(request.params.id));
  response.status(removed ? 204 : 404).send(removed ? undefined : { error: "Player not found" });
}));

app.get("/queue", asyncRoute(async (request, response) => {
  response.json(await listQueue(String(request.query.gamemode || "")));
}));

app.post("/queue/join", asyncRoute(async (request, response) => {
  const result = await joinQueue(request.body);
  response.status(result.status === "cooldown" ? 429 : result.status === "exists" ? 200 : 201).json(result);
}));

app.post("/queue/leave", asyncRoute(async (request, response) => {
  response.json(await leaveQueue(request.body));
}));

app.get("/gamemodes", asyncRoute(async (_request, response) => {
  response.json(await listGamemodes());
}));

app.post("/gamemodes", requireAuth(["ADMIN"]), asyncRoute(async (request, response) => {
  response.status(201).json(await createGamemode(request.body));
}));

app.put("/gamemodes/:id", requireAuth(["ADMIN"]), asyncRoute(async (request, response) => {
  const gamemode = await updateGamemode(String(request.params.id), request.body);
  if (!gamemode) {
    response.status(404).json({ error: "Gamemode not found" });
    return;
  }
  response.json(gamemode);
}));

app.delete("/gamemodes/:id", requireAuth(["ADMIN"]), asyncRoute(async (request, response) => {
  const removed = await deleteGamemode(String(request.params.id));
  response.status(removed ? 204 : 404).send(removed ? undefined : { error: "Gamemode not found" });
}));

app.get("/testers", asyncRoute(async (_request, response) => {
  response.json(await listTesters());
}));

app.post("/testers", requireAuth(["ADMIN"]), asyncRoute(async (request, response) => {
  response.status(201).json(await createTester(request.body));
}));

app.put("/testers/:id", requireAuth(["ADMIN"]), asyncRoute(async (request, response) => {
  const tester = await updateTester(String(request.params.id), request.body);
  if (!tester) {
    response.status(404).json({ error: "Tester not found" });
    return;
  }
  response.json(tester);
}));

app.delete("/testers/:id", requireAuth(["ADMIN"]), asyncRoute(async (request, response) => {
  const removed = await deleteTester(String(request.params.id));
  response.status(removed ? 204 : 404).send(removed ? undefined : { error: "Tester not found" });
}));

app.get("/regions", asyncRoute(async (_request, response) => {
  response.json(await listRegions());
}));

app.get("/tiers", asyncRoute(async (_request, response) => {
  response.json(await listTiers());
}));

app.get("/cooldowns", asyncRoute(async (_request, response) => {
  response.json(await listCooldowns());
}));

app.post("/tests", requireAuth(["ADMIN"]), asyncRoute(async (request, response) => {
  response.status(201).json(await recordTest(request.body));
}));

app.get("/stats", asyncRoute(async (_request, response) => {
  response.json(await getStats());
}));

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  console.error("API error:", error);
  response.status(400).json({ error: message });
});

export { app };
