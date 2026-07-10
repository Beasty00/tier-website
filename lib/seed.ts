import { GAMEMODES, REGIONS, TIERS, type Player, type QueueEntry, type Tester, type TestResult, type WaitlistEntry } from "./types";

export const seedTesters: Tester[] = [];

export const seedTests: TestResult[] = [];

export const seedPlayers: Player[] = [];

export const seedQueue: QueueEntry[] = [];

export const seedWaitlist: WaitlistEntry[] = [];

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
