import { randomUUID } from "node:crypto";
import { GAMEMODES, REGIONS, TIERS, type Gamemode, type Player, type QueueEntry, type RegionCode, type Tester, type TestResult, type TierCode, type WaitlistEntry } from "../lib/types";
import { getStats as getSeedStats, rankPlayers, seedPlayers, seedQueue, seedTesters, seedTests, seedWaitlist } from "../lib/seed";

export type CooldownEntry = {
  id: string;
  username: string;
  discordId?: string;
  gamemode?: string;
  scope: "GLOBAL" | "GAMEMODE";
  expiresAt: string;
  createdAt: string;
};

const queueLimit = () => Number.parseInt(process.env.QUEUE_LIMIT || "32", 10);
const globalCooldownHours = () => Number.parseInt(process.env.GLOBAL_COOLDOWN_HOURS || "24", 10);
const gamemodeCooldownHours = () => Number.parseInt(process.env.GAMEMODE_COOLDOWN_HOURS || "72", 10);

const state = {
  players: rankPlayers(seedPlayers),
  gamemodes: [...GAMEMODES],
  regions: [...REGIONS],
  tiers: [...TIERS],
  testers: [...seedTesters],
  tests: [...seedTests],
  queue: [...seedQueue],
  waitlist: [...seedWaitlist],
  cooldowns: [] as CooldownEntry[],
  verifications: [] as Array<{ id: string; username: string; uuid?: string; discordId: string; createdAt: string }>
};

function nowIso() {
  return new Date().toISOString();
}

function normalize(input?: string) {
  return (input || "").trim().toLowerCase();
}

function estimateMinutes(position: number, gamemode: string) {
  const activeTesters = state.testers.filter((tester) => tester.active && tester.gamemodes.includes(gamemode)).length;
  return Math.max(6, Math.ceil((position * 12) / Math.max(activeTesters, 1)));
}

function tierPoints(tier: TierCode) {
  return state.tiers.find((item) => item.code === tier)?.pointsMin || 600;
}

function recalculateQueue() {
  state.queue = [...state.queue]
    .sort((left, right) => right.priority - left.priority || new Date(left.joinedAt).getTime() - new Date(right.joinedAt).getTime())
    .map((entry, index) => ({
      ...entry,
      position: index + 1,
      estimatedMinutes: estimateMinutes(index + 1, entry.gamemode)
    }));

  state.waitlist = [...state.waitlist]
    .sort((left, right) => right.priority - left.priority || new Date(left.joinedAt).getTime() - new Date(right.joinedAt).getTime())
    .map((entry, index) => ({ ...entry, position: index + 1 }));
}

function promoteWaitlist() {
  recalculateQueue();

  while (state.queue.length < queueLimit() && state.waitlist.length > 0) {
    const promoted = state.waitlist.shift();
    if (!promoted) break;

    state.queue.push({
      id: `queue-${randomUUID()}`,
      username: promoted.username,
      uuid: promoted.uuid,
      discordId: promoted.discordId,
      region: promoted.region,
      gamemode: promoted.gamemode,
      priority: promoted.priority,
      position: state.queue.length + 1,
      status: "WAITING",
      joinedAt: nowIso(),
      estimatedMinutes: estimateMinutes(state.queue.length + 1, promoted.gamemode)
    });
  }

  recalculateQueue();
}

function activeCooldown(username: string, discordId: string | undefined, gamemode: string) {
  const current = Date.now();
  return state.cooldowns.find((cooldown) => {
    const sameIdentity = normalize(cooldown.username) === normalize(username) || Boolean(discordId && cooldown.discordId === discordId);
    const sameScope = cooldown.scope === "GLOBAL" || cooldown.gamemode === gamemode;
    return sameIdentity && sameScope && new Date(cooldown.expiresAt).getTime() > current;
  });
}

export function listPlayers(query: Record<string, unknown>) {
  const search = normalize(String(query.search || query.q || ""));
  const region = String(query.region || "").toUpperCase();
  const gamemode = normalize(String(query.gamemode || "overall"));
  const tier = String(query.tier || "").toUpperCase();
  const page = Math.max(1, Number.parseInt(String(query.page || "1"), 10));
  const limit = Math.min(50, Math.max(1, Number.parseInt(String(query.limit || "10"), 10)));

  let players = rankPlayers(state.players);

  if (search) {
    players = players.filter((player) => normalize(player.username).includes(search) || normalize(player.uuid).includes(search));
  }

  if (region && region !== "ALL") {
    players = players.filter((player) => player.region === region);
  }

  if (tier && tier !== "ALL") {
    players = players.filter((player) => (gamemode === "overall" ? player.tier : player.gamemodeTiers[gamemode]) === tier);
  }

  const total = players.length;
  const start = (page - 1) * limit;

  return {
    items: players.slice(start, start + limit),
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit))
  };
}

export function getPlayer(id: string) {
  const needle = normalize(id);
  return state.players.find((player) => [player.id, player.uuid, player.username].some((value) => normalize(value) === needle));
}

export function createPlayer(input: Partial<Player>) {
  if (!input.username) {
    throw new Error("username is required");
  }

  const tier = (input.tier || "LT5") as TierCode;
  const created: Player = {
    id: input.id || `player-${normalize(input.username).replace(/[^a-z0-9]+/g, "-") || randomUUID()}`,
    uuid: input.uuid || randomUUID(),
    username: input.username,
    skin: input.skin || `https://mc-heads.net/avatar/${encodeURIComponent(input.username)}/128`,
    region: (input.region || "EU") as RegionCode,
    points: input.points ?? tierPoints(tier),
    rank: 0,
    tier,
    tester: input.tester || "System",
    createdAt: input.createdAt || nowIso(),
    lastTestAt: input.lastTestAt || nowIso(),
    gamemodeTiers: input.gamemodeTiers || { overall: tier },
    history: input.history || []
  };

  if (getPlayer(created.username)) {
    throw new Error("player already exists");
  }

  state.players = rankPlayers([...state.players, created]);
  return getPlayer(created.id) || created;
}

export function updatePlayer(id: string, input: Partial<Player>) {
  const index = state.players.findIndex((player) => [player.id, player.uuid, player.username].some((value) => normalize(value) === normalize(id)));
  if (index < 0) return null;

  state.players[index] = {
    ...state.players[index],
    ...input,
    gamemodeTiers: { ...state.players[index].gamemodeTiers, ...(input.gamemodeTiers || {}) },
    history: input.history || state.players[index].history
  };
  state.players = rankPlayers(state.players);
  return getPlayer(state.players[index].id);
}

export function deletePlayer(id: string) {
  const before = state.players.length;
  state.players = state.players.filter((player) => ![player.id, player.uuid, player.username].some((value) => normalize(value) === normalize(id)));
  state.players = rankPlayers(state.players);
  return before !== state.players.length;
}

export function listQueue(gamemode?: string) {
  promoteWaitlist();
  const mode = normalize(gamemode || "");
  const queue = mode ? state.queue.filter((entry) => entry.gamemode === mode) : state.queue;
  const waitlist = mode ? state.waitlist.filter((entry) => entry.gamemode === mode) : state.waitlist;
  return { queue, waitlist, limit: queueLimit() };
}

export function joinQueue(input: { username?: string; uuid?: string; discordId?: string; region?: RegionCode; gamemode?: string; priority?: number }) {
  if (!input.username || !input.region || !input.gamemode) {
    throw new Error("username, region and gamemode are required");
  }

  const gamemode = normalize(input.gamemode);
  const username = input.username.trim();
  const existing = [...state.queue, ...state.waitlist].find((entry) => normalize(entry.username) === normalize(username) && entry.gamemode === gamemode);

  if (existing) {
    return { status: "exists", entry: existing };
  }

  const cooldown = activeCooldown(username, input.discordId, gamemode);
  if (cooldown) {
    return { status: "cooldown", cooldown };
  }

  const base = {
    username,
    uuid: input.uuid,
    discordId: input.discordId,
    region: input.region,
    gamemode,
    priority: input.priority || 0,
    joinedAt: nowIso()
  };

  if (state.queue.length >= queueLimit()) {
    const waitEntry: WaitlistEntry = {
      id: `wait-${randomUUID()}`,
      ...base,
      position: state.waitlist.length + 1,
      notified: false
    };
    state.waitlist.push(waitEntry);
    recalculateQueue();
    return { status: "waitlisted", entry: waitEntry };
  }

  const entry: QueueEntry = {
    id: `queue-${randomUUID()}`,
    ...base,
    position: state.queue.length + 1,
    status: "WAITING",
    estimatedMinutes: estimateMinutes(state.queue.length + 1, gamemode)
  };
  state.queue.push(entry);
  recalculateQueue();

  return { status: "queued", entry: state.queue.find((item) => item.id === entry.id) || entry };
}

export function leaveQueue(input: { username?: string; discordId?: string; gamemode?: string }) {
  const beforeQueue = state.queue.length;
  const beforeWaitlist = state.waitlist.length;
  const username = normalize(input.username);
  const gamemode = normalize(input.gamemode || "");

  const matches = (entry: QueueEntry | WaitlistEntry) => {
    const sameIdentity = Boolean(username && normalize(entry.username) === username) || Boolean(input.discordId && entry.discordId === input.discordId);
    const sameGamemode = !gamemode || entry.gamemode === gamemode;
    return sameIdentity && sameGamemode;
  };

  state.queue = state.queue.filter((entry) => !matches(entry));
  state.waitlist = state.waitlist.filter((entry) => !matches(entry));
  promoteWaitlist();

  return { removed: beforeQueue !== state.queue.length || beforeWaitlist !== state.waitlist.length, queue: state.queue, waitlist: state.waitlist };
}

export function listGamemodes() {
  return state.gamemodes;
}

export function createGamemode(input: Partial<Gamemode>) {
  if (!input.name) throw new Error("name is required");
  const slug = normalize(input.slug || input.name).replace(/[^a-z0-9]+/g, "-");
  if (state.gamemodes.some((mode) => mode.slug === slug)) throw new Error("gamemode already exists");

  const gamemode: Gamemode = {
    id: `mode-${slug}`,
    slug,
    name: input.name,
    description: input.description || "Custom testing mode.",
    icon: input.icon || "#",
    enabled: input.enabled ?? true
  };
  state.gamemodes.push(gamemode);
  return gamemode;
}

export function updateGamemode(id: string, input: Partial<Gamemode>) {
  const index = state.gamemodes.findIndex((mode) => mode.id === id || mode.slug === normalize(id));
  if (index < 0) return null;
  state.gamemodes[index] = { ...state.gamemodes[index], ...input, slug: input.slug ? normalize(input.slug) : state.gamemodes[index].slug };
  return state.gamemodes[index];
}

export function deleteGamemode(id: string) {
  const index = state.gamemodes.findIndex((mode) => mode.id === id || mode.slug === normalize(id));
  if (index < 0) return false;
  const [removed] = state.gamemodes.splice(index, 1);
  state.queue = state.queue.filter((entry) => entry.gamemode !== removed.slug);
  state.waitlist = state.waitlist.filter((entry) => entry.gamemode !== removed.slug);
  state.players = state.players.map((player) => {
    const { [removed.slug]: _removed, ...gamemodeTiers } = player.gamemodeTiers;
    return { ...player, gamemodeTiers };
  });
  return true;
}

export function listTesters() {
  return state.testers;
}

export function createTester(input: Partial<Tester>) {
  if (!input.name || !input.region) throw new Error("name and region are required");
  const tester: Tester = {
    id: `tester-${normalize(input.name).replace(/[^a-z0-9]+/g, "-") || randomUUID()}`,
    name: input.name,
    discordId: input.discordId,
    region: input.region,
    active: input.active ?? true,
    gamemodes: input.gamemodes || ["overall"]
  };
  state.testers.push(tester);
  return tester;
}

export function updateTester(id: string, input: Partial<Tester>) {
  const index = state.testers.findIndex((tester) => tester.id === id || normalize(tester.name) === normalize(id));
  if (index < 0) return null;
  state.testers[index] = { ...state.testers[index], ...input };
  return state.testers[index];
}

export function deleteTester(id: string) {
  const before = state.testers.length;
  state.testers = state.testers.filter((tester) => tester.id !== id && normalize(tester.name) !== normalize(id));
  return before !== state.testers.length;
}

export function recordTest(input: { username?: string; uuid?: string; region?: RegionCode; gamemode?: string; tester?: string; tier?: TierCode; notes?: string; score?: number }) {
  if (!input.username || !input.region || !input.gamemode || !input.tier) {
    throw new Error("username, region, gamemode and tier are required");
  }

  const gamemode = normalize(input.gamemode);
  let player = getPlayer(input.username);
  const tester = input.tester || "System";

  if (!player) {
    player = createPlayer({
      username: input.username,
      uuid: input.uuid,
      region: input.region,
      tier: input.tier,
      tester,
      points: tierPoints(input.tier),
      gamemodeTiers: { [gamemode]: input.tier } as Player["gamemodeTiers"]
    });
  }

  const result: TestResult = {
    id: `test-${randomUUID()}`,
    username: player.username,
    region: input.region,
    gamemode,
    tester,
    tier: input.tier,
    notes: input.notes || "No notes added.",
    createdAt: nowIso()
  };

  state.tests.unshift(result);
  const updatedHistory = [result, ...player.history].slice(0, 20);
  updatePlayer(player.id, {
    tier: gamemode === "overall" ? input.tier : player.tier,
    points: Math.max(player.points, tierPoints(input.tier) + (input.score || 0)),
    tester,
    lastTestAt: result.createdAt,
    gamemodeTiers: { [gamemode]: input.tier } as Player["gamemodeTiers"],
    history: updatedHistory
  });

  const baseTime = Date.now();
  state.cooldowns.push({
    id: `cooldown-global-${randomUUID()}`,
    username: player.username,
    scope: "GLOBAL",
    expiresAt: new Date(baseTime + globalCooldownHours() * 3600000).toISOString(),
    createdAt: nowIso()
  });
  state.cooldowns.push({
    id: `cooldown-mode-${randomUUID()}`,
    username: player.username,
    gamemode,
    scope: "GAMEMODE",
    expiresAt: new Date(baseTime + gamemodeCooldownHours() * 3600000).toISOString(),
    createdAt: nowIso()
  });

  leaveQueue({ username: player.username, gamemode });

  return { result, player: getPlayer(player.id), cooldowns: state.cooldowns.filter((cooldown) => normalize(cooldown.username) === normalize(player.username)) };
}

export function verifyDiscord(input: { username?: string; uuid?: string; discordId?: string }) {
  if (!input.username || !input.discordId) throw new Error("username and discordId are required");
  const verification = { id: `verify-${randomUUID()}`, username: input.username, uuid: input.uuid, discordId: input.discordId, createdAt: nowIso() };
  state.verifications.push(verification);
  const player = getPlayer(input.username);
  if (player) updatePlayer(player.id, { uuid: input.uuid || player.uuid });
  return verification;
}

export function getStats() {
  const seedStats = getSeedStats();
  return {
    ...seedStats,
    players: state.players.length,
    tests: state.tests.length,
    queued: state.queue.length,
    waitlisted: state.waitlist.length,
    activeTesters: state.testers.filter((tester) => tester.active).length,
    gamemodes: state.gamemodes.filter((mode) => mode.enabled).length,
    regions: state.regions.length,
    cooldowns: state.cooldowns.filter((cooldown) => new Date(cooldown.expiresAt).getTime() > Date.now()).length
  };
}

export function listRegions() {
  return state.regions;
}

export function listTiers() {
  return state.tiers;
}

export function listCooldowns() {
  return state.cooldowns;
}
