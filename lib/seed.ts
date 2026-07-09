import { GAMEMODES, REGIONS, TIERS, type Player, type QueueEntry, type Tester, type TestResult, type WaitlistEntry } from "./types";

const now = new Date("2026-06-16T12:00:00.000Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();

export const seedTesters: Tester[] = [
  { id: "tester-kaito", name: "Kaito", discordId: "100000000000000001", region: "EU", active: true, gamemodes: ["overall", "vanilla", "sword", "axe"] },
  { id: "tester-vex", name: "Vex", discordId: "100000000000000002", region: "NA", active: true, gamemodes: ["uhc", "pot", "nethop"] },
  { id: "tester-ash", name: "Ash", discordId: "100000000000000003", region: "AS", active: false, gamemodes: ["smp", "mace"] },
  { id: "tester-rune", name: "Rune", discordId: "100000000000000004", region: "AU", active: true, gamemodes: ["overall", "mace", "smp"] }
];

export const seedTests: TestResult[] = [
  { id: "test-1", username: "ElytraRush", region: "EU", gamemode: "vanilla", tester: "Kaito", tier: "HT1", notes: "Clean spacing, high hit-select consistency.", createdAt: daysAgo(2) },
  { id: "test-2", username: "ObsidianFox", region: "NA", gamemode: "uhc", tester: "Vex", tier: "HT2", notes: "Strong bow pressure, weaker lava recovery.", createdAt: daysAgo(4) },
  { id: "test-3", username: "MaceOrbit", region: "AU", gamemode: "mace", tester: "Rune", tier: "HT1", notes: "Excellent vertical setup discipline.", createdAt: daysAgo(1) },
  { id: "test-4", username: "CrystalPine", region: "AS", gamemode: "smp", tester: "Ash", tier: "LT3", notes: "Stable fundamentals, needs better resource tempo.", createdAt: daysAgo(8) },
  { id: "test-5", username: "NetherWarden", region: "EU", gamemode: "nethop", tester: "Vex", tier: "LT2", notes: "Dominant kit awareness and clean pearl timing.", createdAt: daysAgo(6) },
  { id: "test-6", username: "PotionByte", region: "NA", gamemode: "pot", tester: "Vex", tier: "LT3", notes: "Fast refill speed, inconsistent debuff reads.", createdAt: daysAgo(11) }
];

export const seedPlayers: Player[] = [
  {
    id: "player-elytrarush",
    uuid: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    username: "ElytraRush",
    skin: "https://mc-heads.net/avatar/ElytraRush/128",
    region: "EU",
    points: 2480,
    rank: 1,
    tier: "HT1",
    tester: "Kaito",
    createdAt: daysAgo(42),
    lastTestAt: daysAgo(2),
    gamemodeTiers: { overall: "HT1", vanilla: "HT1", uhc: "LT1", pot: "LT1", nethop: "HT2", smp: "HT1", sword: "HT1", axe: "LT1", mace: "HT2" },
    history: seedTests.filter((test) => test.username === "ElytraRush")
  },
  {
    id: "player-maceorbit",
    uuid: "19f3f3cf-2a60-4f0b-9c9b-9d8b0ad204dd",
    username: "MaceOrbit",
    skin: "https://mc-heads.net/avatar/MaceOrbit/128",
    region: "AU",
    points: 2365,
    rank: 2,
    tier: "LT1",
    tester: "Rune",
    createdAt: daysAgo(38),
    lastTestAt: daysAgo(1),
    gamemodeTiers: { overall: "LT1", vanilla: "HT2", uhc: "LT2", pot: "LT1", nethop: "HT2", smp: "LT1", sword: "LT2", axe: "HT2", mace: "HT1" },
    history: seedTests.filter((test) => test.username === "MaceOrbit")
  },
  {
    id: "player-obsidianfox",
    uuid: "2f1a0642-74b7-4769-b8de-1122844bd08c",
    username: "ObsidianFox",
    skin: "https://mc-heads.net/avatar/ObsidianFox/128",
    region: "NA",
    points: 2180,
    rank: 3,
    tier: "HT2",
    tester: "Vex",
    createdAt: daysAgo(60),
    lastTestAt: daysAgo(4),
    gamemodeTiers: { overall: "HT2", vanilla: "LT1", uhc: "HT2", pot: "LT2", nethop: "HT2", smp: "LT2", sword: "HT2", axe: "LT2", mace: "HT3" },
    history: seedTests.filter((test) => test.username === "ObsidianFox")
  },
  {
    id: "player-netherwarden",
    uuid: "ac18af14-96e6-44c5-a91e-73c33d7c4d7d",
    username: "NetherWarden",
    skin: "https://mc-heads.net/avatar/NetherWarden/128",
    region: "EU",
    points: 2050,
    rank: 4,
    tier: "HT2",
    tester: "Vex",
    createdAt: daysAgo(32),
    lastTestAt: daysAgo(6),
    gamemodeTiers: { overall: "HT2", vanilla: "HT3", uhc: "LT2", pot: "HT2", nethop: "LT2", smp: "LT3", sword: "HT3", axe: "LT2", mace: "HT4" },
    history: seedTests.filter((test) => test.username === "NetherWarden")
  },
  {
    id: "player-crystalpine",
    uuid: "4d2f435f-f3ba-43be-9b72-7a03922d31e6",
    username: "CrystalPine",
    skin: "https://mc-heads.net/avatar/CrystalPine/128",
    region: "AS",
    points: 1740,
    rank: 5,
    tier: "HT3",
    tester: "Ash",
    createdAt: daysAgo(21),
    lastTestAt: daysAgo(8),
    gamemodeTiers: { overall: "HT3", vanilla: "LT3", uhc: "HT4", pot: "HT3", nethop: "LT4", smp: "LT3", sword: "HT3", axe: "LT4", mace: "HT3" },
    history: seedTests.filter((test) => test.username === "CrystalPine")
  },
  {
    id: "player-potionbyte",
    uuid: "a98f46c5-27e3-4fd9-9d5a-713bf00df4aa",
    username: "PotionByte",
    skin: "https://mc-heads.net/avatar/PotionByte/128",
    region: "NA",
    points: 1510,
    rank: 6,
    tier: "LT3",
    tester: "Vex",
    createdAt: daysAgo(18),
    lastTestAt: daysAgo(11),
    gamemodeTiers: { overall: "LT3", vanilla: "HT4", uhc: "LT3", pot: "LT3", nethop: "HT4", smp: "LT4", sword: "HT4", axe: "LT3", mace: "LT5" },
    history: seedTests.filter((test) => test.username === "PotionByte")
  }
];

export const seedQueue: QueueEntry[] = [
  { id: "queue-1", username: "LavaStride", region: "EU", gamemode: "sword", priority: 1, position: 1, status: "WAITING", joinedAt: daysAgo(0), estimatedMinutes: 8 },
  { id: "queue-2", username: "TotemClutch", region: "NA", gamemode: "uhc", priority: 0, position: 2, status: "WAITING", joinedAt: daysAgo(0), estimatedMinutes: 16 },
  { id: "queue-3", username: "BambooCrit", region: "AS", gamemode: "smp", priority: 0, position: 3, status: "WAITING", joinedAt: daysAgo(0), estimatedMinutes: 24 }
];

export const seedWaitlist: WaitlistEntry[] = [
  { id: "wait-1", username: "ShieldTempo", region: "AU", gamemode: "axe", priority: 0, position: 1, joinedAt: daysAgo(0), notified: false }
];

export const seedRegions = REGIONS;
export const seedTiers = TIERS;
export const seedGamemodes = GAMEMODES;

export function getStats() {
  const activeTesterCount = seedTesters.filter((tester) => tester.active).length;

  return {
    players: seedPlayers.length,
    tests: seedTests.length,
    queued: seedQueue.length,
    waitlisted: seedWaitlist.length,
    activeTesters: activeTesterCount,
    gamemodes: seedGamemodes.filter((mode) => mode.enabled).length,
    averageWaitMinutes: Math.round(seedQueue.reduce((sum, entry) => sum + entry.estimatedMinutes, 0) / Math.max(seedQueue.length, 1)),
    regions: seedRegions.length
  };
}

export function rankPlayers(players: Player[]) {
  let previousPoints: number | null = null;
  let previousRank = 0;

  return [...players]
    .sort((left, right) => right.points - left.points || left.username.localeCompare(right.username))
    .map((player, index) => {
      const rank = previousPoints === player.points ? previousRank : index + 1;
      previousPoints = player.points;
      previousRank = rank;
      return { ...player, rank };
    });
}
