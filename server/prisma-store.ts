import { randomUUID } from "node:crypto";
import { prisma } from "./db";
import { GAMEMODES, REGIONS, TIERS, type Gamemode, type Player, type QueueEntry, type RegionCode, type Tester, type TestResult, type TierCode, type WaitlistEntry } from "../lib/types";
import { getStats as getSeedStats, rankPlayers, seedGamemodes, seedPlayers, seedQueue, seedRegions, seedTesters, seedTests, seedTiers, seedWaitlist } from "../lib/seed";
import { placeholderHeadDataUri } from "../lib/skins";
import { mojangAccountExists } from "./mojang";

async function resolveSkin(username: string): Promise<string> {
  const isReal = await mojangAccountExists(username);
  return isReal ? `https://mc-heads.net/avatar/${encodeURIComponent(username)}/128` : placeholderHeadDataUri(username);
}

export type CooldownEntry = {
  id: string;
  username: string;
  discordId?: string;
  gamemode?: string;
  scope: "GLOBAL" | "GAMEMODE";
  expiresAt: string;
  createdAt: string;
};

const QUEUE_WAITING = "WAITING";
const QUEUE_ACTIVE = "ACTIVE";
const COOLDOWN_GLOBAL = "GLOBAL";
const COOLDOWN_GAMEMODE = "GAMEMODE";

type PrismaClientLike = NonNullable<typeof prisma>;
type RelationCode = { code: string };
type RelationSlug = { slug: string };
type RelationName = { name: string };
type TestRow = {
  id: string;
  playerId: string;
  region: RelationCode;
  gamemode: RelationSlug;
  tester?: RelationName | null;
  tier: RelationCode;
  notes?: string | null;
  createdAt: Date;
};
type PlayerRow = {
  id: string;
  uuid: string;
  username: string;
  skin?: string | null;
  region: RelationCode;
  points: number;
  rank: number;
  tier: RelationCode;
  tester?: RelationName | null;
  createdAt: Date;
  lastTestAt?: Date | null;
  tiers: Array<{ gamemode: RelationSlug; tier: RelationCode }>;
  tests: TestRow[];
};
type TesterRow = {
  id: string;
  name: string;
  discordId?: string | null;
  region: RelationCode;
  active: boolean;
  gamemodes: Array<{ gamemode: RelationSlug }>;
};
type QueueRow = {
  id: string;
  username: string;
  uuid?: string | null;
  discordId?: string | null;
  region: RelationCode;
  gamemode: RelationSlug;
  priority: number;
  position: number;
  status: string;
  joinedAt: Date;
};
type WaitlistRow = Omit<QueueRow, "status"> & { notified: boolean };
type CooldownRow = {
  id: string;
  player?: { username: string } | null;
  discordId?: string | null;
  gamemode?: RelationSlug | null;
  scope: "GLOBAL" | "GAMEMODE";
  expiresAt: Date;
  createdAt: Date;
};
type PrismaUnsafe = any;

const queueLimit = () => Number.parseInt(process.env.QUEUE_LIMIT || "32", 10);
const globalCooldownHours = () => Number.parseInt(process.env.GLOBAL_COOLDOWN_HOURS || "24", 10);
const gamemodeCooldownHours = () => Number.parseInt(process.env.GAMEMODE_COOLDOWN_HOURS || "72", 10);

let bootstrapPromise: Promise<void> | null = null;

function db(): PrismaClientLike {
  if (!prisma) {
    throw new Error("DATABASE_URL is not configured");
  }
  return prisma;
}

function nowIso() {
  return new Date().toISOString();
}

function normalize(input?: string) {
  return (input || "").trim().toLowerCase();
}

function parseRegion(input?: string): RegionCode {
  const value = String(input || "EU").toUpperCase();
  return REGIONS.some((region) => region.code === value) ? (value as RegionCode) : "EU";
}

function parseTier(input?: string): TierCode {
  const value = String(input || "LT5").toUpperCase();
  return TIERS.some((tier) => tier.code === value) ? (value as TierCode) : "LT5";
}

function slugify(input: string) {
  return normalize(input).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || randomUUID();
}

function dateToIso(date?: Date | null) {
  return (date || new Date()).toISOString();
}

function tierPoints(tier: TierCode) {
  return TIERS.find((item) => item.code === tier)?.pointsMin || 300;
}

function toGamemode(row: { id: string; slug: string; name: string; description: string | null; icon: string | null; enabled: boolean }): Gamemode {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || "Custom testing mode.",
    icon: row.icon || row.slug.slice(0, 2).toUpperCase(),
    enabled: row.enabled
  };
}

function toTester(row: TesterRow): Tester {
  return {
    id: row.id,
    name: row.name,
    discordId: row.discordId || undefined,
    region: row.region.code as RegionCode,
    active: row.active,
    gamemodes: row.gamemodes.map((item) => item.gamemode.slug)
  };
}

function toTestResult(row: PlayerRow["tests"][number]): TestResult {
  return {
    id: row.id,
    username: row.playerId,
    region: row.region.code as RegionCode,
    gamemode: row.gamemode.slug,
    tester: row.tester?.name || "System",
    tier: row.tier.code as TierCode,
    notes: row.notes || "No notes added.",
    createdAt: dateToIso(row.createdAt)
  };
}

function toPlayer(row: PlayerRow, rank?: number): Player {
  const gamemodeTiers = Object.fromEntries(row.tiers.map((item) => [item.gamemode.slug, item.tier.code as TierCode])) as Record<string, TierCode>;
  return {
    id: row.id,
    uuid: row.uuid,
    username: row.username,
    skin: row.skin || `https://mc-heads.net/avatar/${encodeURIComponent(row.username)}/128`,
    region: row.region.code as RegionCode,
    points: row.points,
    rank: rank || row.rank || 0,
    tier: row.tier.code as TierCode,
    tester: row.tester?.name || row.tests[0]?.tester?.name || "System",
    createdAt: dateToIso(row.createdAt),
    lastTestAt: dateToIso(row.lastTestAt || row.createdAt),
    gamemodeTiers,
    history: row.tests.map((test) => ({ ...toTestResult(test), username: row.username }))
  };
}

function toQueueEntry(row: QueueRow, estimatedMinutes: number): QueueEntry {
  return {
    id: row.id,
    username: row.username,
    uuid: row.uuid || undefined,
    discordId: row.discordId || undefined,
    region: row.region.code as RegionCode,
    gamemode: row.gamemode.slug,
    priority: row.priority,
    position: row.position,
    status: row.status === QUEUE_ACTIVE ? "ACTIVE" : "WAITING",
    joinedAt: dateToIso(row.joinedAt),
    estimatedMinutes
  };
}

function toWaitlistEntry(row: WaitlistRow): WaitlistEntry {
  return {
    id: row.id,
    username: row.username,
    uuid: row.uuid || undefined,
    discordId: row.discordId || undefined,
    region: row.region.code as RegionCode,
    gamemode: row.gamemode.slug,
    priority: row.priority,
    position: row.position,
    joinedAt: dateToIso(row.joinedAt),
    notified: row.notified
  };
}

function toCooldownEntry(row: CooldownRow): CooldownEntry {
  return {
    id: row.id,
    username: row.player?.username || row.discordId || "unknown",
    discordId: row.discordId || undefined,
    gamemode: row.gamemode?.slug,
    scope: row.scope,
    expiresAt: dateToIso(row.expiresAt),
    createdAt: dateToIso(row.createdAt)
  };
}

async function ensureDatabase() {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }
  return bootstrapPromise;
}

async function bootstrap() {
  const client = db();

  for (const region of seedRegions) {
    await client.region.upsert({
      where: { code: region.code },
      update: { name: region.name, enabled: region.enabled },
      create: { id: region.id, code: region.code, name: region.name, enabled: region.enabled }
    });
  }

  for (const tier of seedTiers) {
    await client.tier.upsert({
      where: { code: tier.code },
      update: { label: tier.label, order: tier.order, pointsMin: tier.pointsMin },
      create: { id: tier.id, code: tier.code, label: tier.label, order: tier.order, pointsMin: tier.pointsMin }
    });
  }

  for (const gamemode of seedGamemodes) {
    await client.gamemode.upsert({
      where: { slug: gamemode.slug },
      update: { name: gamemode.name, description: gamemode.description, icon: gamemode.icon, enabled: gamemode.enabled },
      create: {
        id: gamemode.id,
        slug: gamemode.slug,
        name: gamemode.name,
        description: gamemode.description,
        icon: gamemode.icon,
        enabled: gamemode.enabled
      }
    });
  }

  if ((await client.tester.count()) === 0) {
    for (const tester of seedTesters) {
      await createTester(tester, false);
    }
  }

  if ((await client.player.count()) === 0) {
    for (const player of seedPlayers) {
      await createPlayer(player, false);
    }
  }

  if ((await client.test.count()) === 0) {
    await seedTestHistory();
  }

  if ((await client.queue.count()) === 0 && (await client.waitlist.count()) === 0) {
    await seedQueueAndWaitlist();
  }
}

async function seedQueueAndWaitlist() {
  const client = db();
  for (const entry of seedQueue) {
    const region = await findRegion(entry.region);
    const gamemode = await findGamemode(entry.gamemode);
    await client.queue.create({
      data: {
        id: entry.id,
        username: entry.username,
        uuid: entry.uuid,
        discordId: entry.discordId,
        regionId: region.id,
        gamemodeId: gamemode.id,
        status: QUEUE_WAITING,
        priority: entry.priority,
        position: entry.position,
        joinedAt: new Date(entry.joinedAt)
      }
    });
  }

  for (const entry of seedWaitlist) {
    const region = await findRegion(entry.region);
    const gamemode = await findGamemode(entry.gamemode);
    await client.waitlist.create({
      data: {
        id: entry.id,
        username: entry.username,
        uuid: entry.uuid,
        discordId: entry.discordId,
        regionId: region.id,
        gamemodeId: gamemode.id,
        priority: entry.priority,
        position: entry.position,
        joinedAt: new Date(entry.joinedAt),
        notified: entry.notified
      }
    });
  }
}

async function seedTestHistory() {
  for (const test of seedTests) {
    const player = await db().player.findFirst({ where: { username: { equals: test.username, mode: "insensitive" } } });
    const region = await db().region.findUnique({ where: { code: test.region } });
    const gamemode = await db().gamemode.findUnique({ where: { slug: test.gamemode } });
    const tester = await db().tester.findFirst({ where: { name: { equals: test.tester, mode: "insensitive" } } });
    const tier = await db().tier.findUnique({ where: { code: test.tier } });

    if (!player || !region || !gamemode || !tier) continue;

    await db().test.create({
      data: {
        id: test.id,
        playerId: player.id,
        regionId: region.id,
        gamemodeId: gamemode.id,
        testerId: tester?.id,
        tierId: tier.id,
        notes: test.notes,
        createdAt: new Date(test.createdAt)
      }
    });
  }
}

async function findRegion(code: string) {
  return db().region.findUniqueOrThrow({ where: { code: parseRegion(code) } });
}

async function findTier(code: string) {
  return db().tier.findUniqueOrThrow({ where: { code: parseTier(code) } });
}

async function findGamemode(slug: string) {
  const gamemode = await db().gamemode.findUnique({ where: { slug: normalize(slug || "overall") } });
  if (!gamemode) throw new Error("gamemode not found");
  return gamemode;
}

async function findPlayerIdentity(id: string) {
  await ensureDatabase();
  const needle = id.trim();
  return db().player.findFirst({
    where: {
      OR: [
        { id: needle },
        { uuid: needle },
        { username: { equals: needle, mode: "insensitive" } }
      ]
    },
    include: {
      region: true,
      tier: true,
      tester: true,
      tiers: { include: { gamemode: true, tier: true } },
      tests: {
        include: { gamemode: true, region: true, tier: true, tester: true },
        orderBy: { createdAt: "desc" },
        take: 20
      }
    }
  });
}

async function playerRank(playerId: string, points: number) {
  await ensureDatabase();
  const higher = await db().player.count({ where: { points: { gt: points } } });
  return higher + 1;
}

async function updateRanks() {
  const players = await db().player.findMany({ orderBy: [{ points: "desc" }, { username: "asc" }], select: { id: true, points: true } }) as Array<{ id: string; points: number }>;
  let previousPoints: number | null = null;
  let previousRank = 0;
  await Promise.all(players.map((player: { id: string; points: number }, index: number) => {
    const rank = previousPoints === player.points ? previousRank : index + 1;
    previousPoints = player.points;
    previousRank = rank;
    return db().player.update({ where: { id: player.id }, data: { rank } });
  }));
}

async function estimateMinutes(position: number, gamemodeSlug: string) {
  const activeTesters = await db().tester.count({
    where: {
      active: true,
      gamemodes: { some: { gamemode: { slug: gamemodeSlug } } }
    }
  });
  return Math.max(6, Math.ceil((position * 12) / Math.max(activeTesters, 1)));
}

async function recalculateQueue() {
  const client = db();
  const queue = await client.queue.findMany({
    where: { status: QUEUE_WAITING },
    orderBy: [{ priority: "desc" }, { joinedAt: "asc" }]
  }) as Array<{ id: string }>;
  await Promise.all(queue.map((entry: { id: string }, index: number) => client.queue.update({ where: { id: entry.id }, data: { position: index + 1 } })));

  const waitlist = await client.waitlist.findMany({ orderBy: [{ priority: "desc" }, { joinedAt: "asc" }] }) as Array<{ id: string }>;
  await Promise.all(waitlist.map((entry: { id: string }, index: number) => client.waitlist.update({ where: { id: entry.id }, data: { position: index + 1 } })));
}

async function promoteWaitlist() {
  await recalculateQueue();

  const client = db();
  let queueCount = await client.queue.count({ where: { status: QUEUE_WAITING } });
  while (queueCount < queueLimit()) {
    const promoted = await client.waitlist.findFirst({ orderBy: [{ priority: "desc" }, { joinedAt: "asc" }] });
    if (!promoted) break;

    await client.queue.create({
      data: {
        username: promoted.username,
        uuid: promoted.uuid,
        discordId: promoted.discordId,
        playerId: promoted.playerId,
        regionId: promoted.regionId,
        gamemodeId: promoted.gamemodeId,
        priority: promoted.priority,
        position: queueCount + 1,
        status: QUEUE_WAITING
      }
    });
    await client.waitlist.delete({ where: { id: promoted.id } });
    queueCount += 1;
  }

  await recalculateQueue();
}

async function activeCooldown(username: string, discordId: string | undefined, gamemode: string) {
  const player = await db().player.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true }
  });
  const identities: PrismaUnsafe[] = [
    ...(player ? [{ playerId: player.id }] : []),
    ...(discordId ? [{ discordId }] : [])
  ];
  if (identities.length === 0) return null;

  const cooldown = await db().cooldown.findFirst({
    where: {
      expiresAt: { gt: new Date() },
      OR: identities,
      AND: [
        {
          OR: [
            { scope: COOLDOWN_GLOBAL },
            { gamemode: { slug: gamemode } }
          ]
        }
      ]
    },
    include: { player: true, gamemode: true },
    orderBy: { expiresAt: "desc" }
  });
  return cooldown ? toCooldownEntry(cooldown) : null;
}

export async function listPlayers(query: Record<string, unknown>) {
  await ensureDatabase();
  const search = normalize(String(query.search || query.q || ""));
  const region = String(query.region || "").toUpperCase();
  const gamemode = normalize(String(query.gamemode || "overall"));
  const tier = String(query.tier || "").toUpperCase();
  const page = Math.max(1, Number.parseInt(String(query.page || "1"), 10));
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(query.limit || "10"), 10)));

  const where: PrismaUnsafe = {
    ...(search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { uuid: { contains: search, mode: "insensitive" } }
          ]
        }
      : {}),
    ...(region && region !== "ALL" ? { region: { code: region as RegionCode } } : {}),
    ...(tier && tier !== "ALL"
      ? gamemode === "overall"
        ? { tier: { code: tier as TierCode } }
        : { tiers: { some: { gamemode: { slug: gamemode }, tier: { code: tier as TierCode } } } }
      : {})
  };

  const total = await db().player.count({ where });
  const rows = await db().player.findMany({
    where,
    orderBy: [{ points: "desc" }, { username: "asc" }],
    skip: (page - 1) * limit,
    take: limit,
    include: {
      region: true,
      tier: true,
      tester: true,
      tiers: { include: { gamemode: true, tier: true } },
      tests: {
        include: { gamemode: true, region: true, tier: true, tester: true },
        orderBy: { createdAt: "desc" },
        take: 20
      }
    }
  }) as PlayerRow[];

  const items = rows.map((row: PlayerRow, index: number) => toPlayer(row, (page - 1) * limit + index + 1));
  return {
    items,
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit))
  };
}

export async function getPlayer(id: string) {
  const player = await findPlayerIdentity(id);
  if (!player) return null;
  return toPlayer(player, await playerRank(player.id, player.points));
}

export async function createPlayer(input: Partial<Player>, runBootstrap = true) {
  if (runBootstrap) await ensureDatabase();
  if (!input.username) throw new Error("username is required");

  const username = input.username.trim();
  const existing = await db().player.findFirst({ where: { username: { equals: username, mode: "insensitive" } } });
  if (existing) throw new Error("player already exists");

  const tier = await findTier(input.tier || "LT5");
  const region = await findRegion(input.region || "EU");
  const tester = input.tester ? await db().tester.findFirst({ where: { name: { equals: input.tester, mode: "insensitive" } } }) : null;
  const skin = input.skin || (await resolveSkin(username));
  const created = await db().player.create({
    data: {
      id: input.id || `player-${slugify(username)}`,
      uuid: input.uuid || randomUUID(),
      username,
      skin,
      regionId: region.id,
      points: input.points ?? tier.pointsMin,
      rank: input.rank || 0,
      tierId: tier.id,
      testerId: tester?.id,
      createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
      lastTestAt: input.lastTestAt ? new Date(input.lastTestAt) : new Date()
    }
  });

  const tierEntries = Object.entries(input.gamemodeTiers || {});
  for (const [slug, tierCode] of tierEntries) {
    const mode = await db().gamemode.findUnique({ where: { slug } });
    if (!mode) continue;
    const modeTier = await findTier(tierCode);
    await db().playerTier.create({
      data: {
        playerId: created.id,
        gamemodeId: mode.id,
        tierId: modeTier.id,
        testerId: tester?.id,
        points: input.points ?? modeTier.pointsMin
      }
    });
  }

  await updateRanks();
  return getPlayer(created.id);
}

export async function updatePlayer(id: string, input: Partial<Player>) {
  await ensureDatabase();
  const existing = await findPlayerIdentity(id);
  if (!existing) return null;

  const data: PrismaUnsafe = {
    ...(input.uuid ? { uuid: input.uuid } : {}),
    ...(input.username ? { username: input.username } : {}),
    ...(input.skin ? { skin: input.skin } : {}),
    ...(typeof input.points === "number" ? { points: input.points } : {}),
    ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
    ...(input.lastTestAt ? { lastTestAt: new Date(input.lastTestAt) } : {})
  };

  if (input.region) data.region = { connect: { code: parseRegion(input.region) } };
  if (input.tier) data.tier = { connect: { code: parseTier(input.tier) } };
  if (input.tester) {
    const tester = await db().tester.findFirst({ where: { name: { equals: input.tester, mode: "insensitive" } } });
    if (tester) data.tester = { connect: { id: tester.id } };
  }

  await db().player.update({ where: { id: existing.id }, data });

  if (input.gamemodeTiers) {
    for (const [slug, tierCode] of Object.entries(input.gamemodeTiers)) {
      const gamemode = await db().gamemode.findUnique({ where: { slug } });
      const tier = await db().tier.findUnique({ where: { code: parseTier(tierCode) } });
      if (!gamemode || !tier) continue;
      await db().playerTier.upsert({
        where: { playerId_gamemodeId: { playerId: existing.id, gamemodeId: gamemode.id } },
        update: { tierId: tier.id },
        create: { playerId: existing.id, gamemodeId: gamemode.id, tierId: tier.id, points: tier.pointsMin }
      });
    }
  }

  await updateRanks();
  return getPlayer(existing.id);
}

export async function deletePlayer(id: string) {
  await ensureDatabase();
  const existing = await findPlayerIdentity(id);
  if (!existing) return false;

  await db().queue.deleteMany({ where: { playerId: existing.id } });
  await db().waitlist.deleteMany({ where: { playerId: existing.id } });
  await db().cooldown.deleteMany({ where: { playerId: existing.id } });
  await db().user.updateMany({ where: { playerId: existing.id }, data: { playerId: null } });
  await db().player.delete({ where: { id: existing.id } });
  await updateRanks();
  return true;
}

export async function listQueue(gamemode?: string) {
  await ensureDatabase();
  await promoteWaitlist();
  const mode = normalize(gamemode || "");
  const queueRows = await db().queue.findMany({
    where: {
      status: QUEUE_WAITING,
      ...(mode ? { gamemode: { slug: mode } } : {})
    },
    orderBy: [{ position: "asc" }],
    include: { region: true, gamemode: true }
  }) as QueueRow[];
  const waitlistRows = await db().waitlist.findMany({
    where: mode ? { gamemode: { slug: mode } } : {},
    orderBy: [{ position: "asc" }],
    include: { region: true, gamemode: true }
  }) as WaitlistRow[];
  const queue = await Promise.all(queueRows.map(async (entry: QueueRow) => toQueueEntry(entry, await estimateMinutes(entry.position, entry.gamemode.slug))));
  return { queue, waitlist: waitlistRows.map(toWaitlistEntry), limit: queueLimit() };
}

export async function joinQueue(input: { username?: string; uuid?: string; discordId?: string; region?: RegionCode; gamemode?: string; priority?: number }) {
  await ensureDatabase();
  if (!input.username || !input.region || !input.gamemode) {
    throw new Error("username, region and gamemode are required");
  }

  const username = input.username.trim();
  const gamemodeSlug = normalize(input.gamemode);
  const gamemode = await findGamemode(gamemodeSlug);
  const region = await findRegion(input.region);
  const player = await db().player.findFirst({ where: { username: { equals: username, mode: "insensitive" } } });

  const existingQueue = await db().queue.findFirst({
    where: { username: { equals: username, mode: "insensitive" }, gamemodeId: gamemode.id, status: QUEUE_WAITING },
    include: { region: true, gamemode: true }
  });
  if (existingQueue) {
    return { status: "exists", entry: toQueueEntry(existingQueue, await estimateMinutes(existingQueue.position, gamemode.slug)) };
  }

  const existingWaitlist = await db().waitlist.findFirst({
    where: { username: { equals: username, mode: "insensitive" }, gamemodeId: gamemode.id },
    include: { region: true, gamemode: true }
  });
  if (existingWaitlist) {
    return { status: "exists", entry: toWaitlistEntry(existingWaitlist) };
  }

  const cooldown = await activeCooldown(username, input.discordId, gamemode.slug);
  if (cooldown) {
    return { status: "cooldown", cooldown };
  }

  const currentQueueSize = await db().queue.count({ where: { status: QUEUE_WAITING } });
  if (currentQueueSize >= queueLimit()) {
    const entry = await db().waitlist.create({
      data: {
        username,
        uuid: input.uuid,
        discordId: input.discordId,
        playerId: player?.id,
        regionId: region.id,
        gamemodeId: gamemode.id,
        priority: input.priority || 0,
        position: 0
      },
      include: { region: true, gamemode: true }
    });
    await recalculateQueue();
    const fresh = await db().waitlist.findUniqueOrThrow({ where: { id: entry.id }, include: { region: true, gamemode: true } });
    return { status: "waitlisted", entry: toWaitlistEntry(fresh) };
  }

  const entry = await db().queue.create({
    data: {
      username,
      uuid: input.uuid,
      discordId: input.discordId,
      playerId: player?.id,
      regionId: region.id,
      gamemodeId: gamemode.id,
      priority: input.priority || 0,
      position: 0,
      status: QUEUE_WAITING
    },
    include: { region: true, gamemode: true }
  });
  await recalculateQueue();
  const fresh = await db().queue.findUniqueOrThrow({ where: { id: entry.id }, include: { region: true, gamemode: true } });
  return { status: "queued", entry: toQueueEntry(fresh, await estimateMinutes(fresh.position, gamemode.slug)) };
}

export async function leaveQueue(input: { username?: string; discordId?: string; gamemode?: string }) {
  await ensureDatabase();
  const username = normalize(input.username);
  const gamemode = normalize(input.gamemode || "");
  const queueIdentity = [
    ...(username ? [{ username: { equals: username, mode: "insensitive" as const } }] : []),
    ...(input.discordId ? [{ discordId: input.discordId }] : [])
  ];
  const waitlistIdentity = [
    ...(username ? [{ username: { equals: username, mode: "insensitive" as const } }] : []),
    ...(input.discordId ? [{ discordId: input.discordId }] : [])
  ];
  const queueWhere: PrismaUnsafe = {
    ...(gamemode ? { gamemode: { slug: gamemode } } : {}),
    OR: queueIdentity
  };
  const waitlistWhere: PrismaUnsafe = {
    ...(gamemode ? { gamemode: { slug: gamemode } } : {}),
    OR: waitlistIdentity
  };

  if (!queueIdentity.length && !waitlistIdentity.length) {
    return { removed: false, ...(await listQueue(gamemode)) };
  }

  const queueResult = await db().queue.deleteMany({ where: queueWhere });
  const waitlistResult = await db().waitlist.deleteMany({ where: waitlistWhere });
  await promoteWaitlist();
  const data = await listQueue(gamemode);
  return { removed: queueResult.count + waitlistResult.count > 0, ...data };
}

export async function listGamemodes() {
  await ensureDatabase();
  const rows = await db().gamemode.findMany({ orderBy: [{ createdAt: "asc" }] });
  return rows.map(toGamemode);
}

export async function createGamemode(input: Partial<Gamemode>) {
  await ensureDatabase();
  if (!input.name) throw new Error("name is required");
  const slug = slugify(input.slug || input.name);
  if (await db().gamemode.findUnique({ where: { slug } })) throw new Error("gamemode already exists");

  const gamemode = await db().gamemode.create({
    data: {
      id: input.id || `mode-${slug}`,
      slug,
      name: input.name,
      description: input.description || "Custom testing mode.",
      icon: input.icon || slug.slice(0, 2).toUpperCase(),
      enabled: input.enabled ?? true
    }
  });

  return toGamemode(gamemode);
}

export async function updateGamemode(id: string, input: Partial<Gamemode>) {
  await ensureDatabase();
  const existing = await db().gamemode.findFirst({ where: { OR: [{ id }, { slug: normalize(id) }] } });
  if (!existing) return null;
  const updated = await db().gamemode.update({
    where: { id: existing.id },
    data: {
      ...(input.slug ? { slug: slugify(input.slug) } : {}),
      ...(input.name ? { name: input.name } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.icon ? { icon: input.icon } : {}),
      ...(typeof input.enabled === "boolean" ? { enabled: input.enabled } : {})
    }
  });
  return toGamemode(updated);
}

export async function deleteGamemode(id: string) {
  await ensureDatabase();
  const existing = await db().gamemode.findFirst({ where: { OR: [{ id }, { slug: normalize(id) }] } });
  if (!existing) return false;

  await db().queue.deleteMany({ where: { gamemodeId: existing.id } });
  await db().waitlist.deleteMany({ where: { gamemodeId: existing.id } });
  await db().cooldown.deleteMany({ where: { gamemodeId: existing.id } });
  await db().test.deleteMany({ where: { gamemodeId: existing.id } });
  await db().playerTier.deleteMany({ where: { gamemodeId: existing.id } });
  await db().testerGamemode.deleteMany({ where: { gamemodeId: existing.id } });
  await db().gamemode.delete({ where: { id: existing.id } });
  return true;
}

export async function listTesters() {
  await ensureDatabase();
  const rows = await db().tester.findMany({
    orderBy: [{ name: "asc" }],
    include: { region: true, gamemodes: { include: { gamemode: true } } }
  });
  return rows.map(toTester);
}

export async function createTester(input: Partial<Tester>, runBootstrap = true) {
  if (runBootstrap) await ensureDatabase();
  if (!input.name || !input.region) throw new Error("name and region are required");
  const region = await findRegion(input.region);
  const tester = await db().tester.create({
    data: {
      id: input.id || `tester-${slugify(input.name)}`,
      name: input.name,
      discordId: input.discordId,
      regionId: region.id,
      active: input.active ?? true
    }
  });

  const gamemodes = input.gamemodes?.length ? input.gamemodes : ["overall"];
  for (const slug of gamemodes) {
    const gamemode = await db().gamemode.findUnique({ where: { slug: normalize(slug) } });
    if (gamemode) {
      await db().testerGamemode.create({ data: { testerId: tester.id, gamemodeId: gamemode.id } });
    }
  }

  const fresh = await db().tester.findUniqueOrThrow({
    where: { id: tester.id },
    include: { region: true, gamemodes: { include: { gamemode: true } } }
  });
  return toTester(fresh);
}

export async function updateTester(id: string, input: Partial<Tester>) {
  await ensureDatabase();
  const existing = await db().tester.findFirst({ where: { OR: [{ id }, { name: { equals: id, mode: "insensitive" } }] } });
  if (!existing) return null;

  const data: PrismaUnsafe = {
    ...(input.name ? { name: input.name } : {}),
    ...(typeof input.active === "boolean" ? { active: input.active } : {}),
    ...(input.discordId !== undefined ? { discordId: input.discordId || null } : {})
  };
  if (input.region) data.region = { connect: { code: parseRegion(input.region) } };

  await db().tester.update({ where: { id: existing.id }, data });

  if (input.gamemodes) {
    await db().testerGamemode.deleteMany({ where: { testerId: existing.id } });
    for (const slug of input.gamemodes) {
      const gamemode = await db().gamemode.findUnique({ where: { slug: normalize(slug) } });
      if (gamemode) {
        await db().testerGamemode.create({ data: { testerId: existing.id, gamemodeId: gamemode.id } });
      }
    }
  }

  const fresh = await db().tester.findUniqueOrThrow({
    where: { id: existing.id },
    include: { region: true, gamemodes: { include: { gamemode: true } } }
  });
  return toTester(fresh);
}

export async function deleteTester(id: string) {
  await ensureDatabase();
  const existing = await db().tester.findFirst({ where: { OR: [{ id }, { name: { equals: id, mode: "insensitive" } }] } });
  if (!existing) return false;

  await db().player.updateMany({ where: { testerId: existing.id }, data: { testerId: null } });
  await db().test.updateMany({ where: { testerId: existing.id }, data: { testerId: null } });
  await db().playerTier.updateMany({ where: { testerId: existing.id }, data: { testerId: null } });
  await db().testerGamemode.deleteMany({ where: { testerId: existing.id } });
  await db().tester.delete({ where: { id: existing.id } });
  return true;
}

export async function recordTest(input: { username?: string; uuid?: string; region?: RegionCode; gamemode?: string; tester?: string; tier?: TierCode; notes?: string; score?: number }, runBootstrap = true) {
  if (runBootstrap) await ensureDatabase();
  if (!input.username || !input.region || !input.gamemode || !input.tier) {
    throw new Error("username, region, gamemode and tier are required");
  }

  const username = input.username.trim();
  const region = await findRegion(input.region);
  const tier = await findTier(input.tier);
  const gamemode = await findGamemode(input.gamemode);
  const tester = input.tester ? await db().tester.findFirst({ where: { name: { equals: input.tester, mode: "insensitive" } } }) : null;
  let player = await db().player.findFirst({ where: { username: { equals: username, mode: "insensitive" } } });

  if (!player) {
    const created = await createPlayer({
      username,
      uuid: input.uuid,
      region: input.region,
      tier: input.tier,
      tester: input.tester || "System",
      points: tier.pointsMin + (input.score || 0),
      gamemodeTiers: { [gamemode.slug]: input.tier } as Player["gamemodeTiers"]
    }, false);
    if (!created) throw new Error("player could not be created");
    player = await db().player.findUniqueOrThrow({ where: { id: created.id } });
  }

  const createdTest = await db().test.create({
    data: {
      playerId: player.id,
      regionId: region.id,
      gamemodeId: gamemode.id,
      testerId: tester?.id,
      tierId: tier.id,
      notes: input.notes || "No notes added.",
      score: input.score || 0
    },
    include: { gamemode: true, region: true, tier: true, tester: true, player: true }
  });

  await db().playerTier.upsert({
    where: { playerId_gamemodeId: { playerId: player.id, gamemodeId: gamemode.id } },
    update: { tierId: tier.id, testerId: tester?.id, points: tier.pointsMin + (input.score || 0) },
    create: { playerId: player.id, gamemodeId: gamemode.id, tierId: tier.id, testerId: tester?.id, points: tier.pointsMin + (input.score || 0) }
  });

  const playerTiers = await db().playerTier.findMany({
    where: { playerId: player.id },
    include: { gamemode: true }
  }) as Array<{ points: number; gamemode: { slug: string } }>;
  const totalPoints = playerTiers
    .filter((row: { gamemode: { slug: string } }) => row.gamemode.slug !== "overall")
    .reduce((total: number, row: { points: number }) => total + row.points, 0);

  await db().player.update({
    where: { id: player.id },
    data: {
      points: totalPoints,
      lastTestAt: createdTest.createdAt,
      testerId: tester?.id,
      ...(gamemode.slug === "overall" ? { tierId: tier.id } : {})
    }
  });

  const baseTime = Date.now();
  await db().cooldown.createMany({
    data: [
      {
        playerId: player.id,
        discordId: player.discordId,
        scope: COOLDOWN_GLOBAL,
        expiresAt: new Date(baseTime + globalCooldownHours() * 3600000)
      },
      {
        playerId: player.id,
        discordId: player.discordId,
        gamemodeId: gamemode.id,
        scope: COOLDOWN_GAMEMODE,
        expiresAt: new Date(baseTime + gamemodeCooldownHours() * 3600000)
      }
    ]
  });

  await leaveQueue({ username: player.username, gamemode: gamemode.slug });
  await updateRanks();

  const result: TestResult = {
    id: createdTest.id,
    username: player.username,
    region: region.code as RegionCode,
    gamemode: gamemode.slug,
    tester: tester?.name || input.tester || "System",
    tier: tier.code as TierCode,
    notes: createdTest.notes || "No notes added.",
    createdAt: dateToIso(createdTest.createdAt)
  };

  const cooldowns = await db().cooldown.findMany({ where: { playerId: player.id }, include: { player: true, gamemode: true }, orderBy: { expiresAt: "desc" } });
  return { result, player: await getPlayer(player.id), cooldowns: cooldowns.map(toCooldownEntry) };
}

export async function verifyDiscord(input: { username?: string; uuid?: string; discordId?: string }) {
  await ensureDatabase();
  if (!input.username || !input.discordId) throw new Error("username and discordId are required");

  const player = await db().player.findFirst({ where: { username: { equals: input.username, mode: "insensitive" } } });
  if (player) {
    await db().player.update({
      where: { id: player.id },
      data: { uuid: input.uuid || player.uuid, discordId: input.discordId }
    });
  }

  await db().user.upsert({
    where: { discordId: input.discordId },
    update: { username: input.username, playerId: player?.id },
    create: { discordId: input.discordId, username: input.username, playerId: player?.id }
  });

  return { id: `verify-${randomUUID()}`, username: input.username, uuid: input.uuid, discordId: input.discordId, createdAt: nowIso() };
}

export async function getStats() {
  await ensureDatabase();
  const seedStats = getSeedStats();
  const queued = await db().queue.count({ where: { status: QUEUE_WAITING } });
  const waitlisted = await db().waitlist.count();
  const queueRows = await db().queue.findMany({ where: { status: QUEUE_WAITING }, select: { position: true } }) as Array<{ position: number }>;
  return {
    ...seedStats,
    players: await db().player.count(),
    tests: await db().test.count(),
    queued,
    waitlisted,
    activeTesters: await db().tester.count({ where: { active: true } }),
    gamemodes: await db().gamemode.count({ where: { enabled: true } }),
    regions: await db().region.count(),
    cooldowns: await db().cooldown.count({ where: { expiresAt: { gt: new Date() } } }),
    averageWaitMinutes: Math.round(queueRows.reduce((sum: number, entry: { position: number }) => sum + Math.max(6, entry.position * 12), 0) / Math.max(queueRows.length, 1))
  };
}

export async function listRegions() {
  await ensureDatabase();
  const rows = await db().region.findMany({ orderBy: { code: "asc" } }) as Array<{ id: string; code: string; name: string; enabled: boolean }>;
  return rows.map((row: { id: string; code: string; name: string; enabled: boolean }) => ({ id: row.id, code: row.code as RegionCode, name: row.name, enabled: row.enabled }));
}

export async function listTiers() {
  await ensureDatabase();
  const rows = await db().tier.findMany({ orderBy: { order: "asc" } }) as Array<{ id: string; code: string; label: string; order: number; pointsMin: number }>;
  return rows.map((row: { id: string; code: string; label: string; order: number; pointsMin: number }) => ({ id: row.id, code: row.code as TierCode, label: row.label, order: row.order, pointsMin: row.pointsMin }));
}

export async function listCooldowns() {
  await ensureDatabase();
  const rows = await db().cooldown.findMany({
    where: { expiresAt: { gt: new Date() } },
    include: { player: true, gamemode: true },
    orderBy: { expiresAt: "asc" }
  });
  return rows.map(toCooldownEntry);
}

export function fallbackPlayers() {
  return rankPlayers(seedPlayers);
}
