import { prisma } from "./db";
import * as memory from "./memory-store";
import * as persisted from "./prisma-store";

let fallbackUntil = 0;
const fallbackMs = Number.parseInt(process.env.STORE_FALLBACK_MS || "60000", 10);

async function withStore<T>(label: string, databaseAction: () => Promise<T>, memoryAction: () => unknown): Promise<T> {
  if (!prisma || Date.now() < fallbackUntil) {
    return memoryAction() as T;
  }

  try {
    return await databaseAction();
  } catch (error) {
    fallbackUntil = Date.now() + fallbackMs;
    console.warn(`Database store failed for ${label}; using memory fallback for ${Math.round(fallbackMs / 1000)}s.`, error);
    return memoryAction() as T;
  }
}

export const listPlayers = (query: Record<string, unknown>) => withStore("listPlayers", () => persisted.listPlayers(query), () => memory.listPlayers(query));
export const getPlayer = (id: string) => withStore("getPlayer", () => persisted.getPlayer(id), () => memory.getPlayer(id));
export const createPlayer = (input: Parameters<typeof memory.createPlayer>[0]) => withStore("createPlayer", () => persisted.createPlayer(input), () => memory.createPlayer(input));
export const updatePlayer = (id: string, input: Parameters<typeof memory.updatePlayer>[1]) => withStore("updatePlayer", () => persisted.updatePlayer(id, input), () => memory.updatePlayer(id, input));
export const deletePlayer = (id: string) => withStore("deletePlayer", () => persisted.deletePlayer(id), () => memory.deletePlayer(id));

export const listQueue = (gamemode?: string) => withStore("listQueue", () => persisted.listQueue(gamemode), () => memory.listQueue(gamemode));
export const joinQueue = (input: Parameters<typeof memory.joinQueue>[0]) => withStore("joinQueue", () => persisted.joinQueue(input), () => memory.joinQueue(input));
export const leaveQueue = (input: Parameters<typeof memory.leaveQueue>[0]) => withStore("leaveQueue", () => persisted.leaveQueue(input), () => memory.leaveQueue(input));

export const listGamemodes = () => withStore("listGamemodes", () => persisted.listGamemodes(), () => memory.listGamemodes());
export const createGamemode = (input: Parameters<typeof memory.createGamemode>[0]) => withStore("createGamemode", () => persisted.createGamemode(input), () => memory.createGamemode(input));
export const updateGamemode = (id: string, input: Parameters<typeof memory.updateGamemode>[1]) => withStore("updateGamemode", () => persisted.updateGamemode(id, input), () => memory.updateGamemode(id, input));
export const deleteGamemode = (id: string) => withStore("deleteGamemode", () => persisted.deleteGamemode(id), () => memory.deleteGamemode(id));

export const listTesters = () => withStore("listTesters", () => persisted.listTesters(), () => memory.listTesters());
export const createTester = (input: Parameters<typeof memory.createTester>[0]) => withStore("createTester", () => persisted.createTester(input), () => memory.createTester(input));
export const updateTester = (id: string, input: Parameters<typeof memory.updateTester>[1]) => withStore("updateTester", () => persisted.updateTester(id, input), () => memory.updateTester(id, input));
export const deleteTester = (id: string) => withStore("deleteTester", () => persisted.deleteTester(id), () => memory.deleteTester(id));

export const listRegions = () => withStore("listRegions", () => persisted.listRegions(), () => memory.listRegions());
export const listTiers = () => withStore("listTiers", () => persisted.listTiers(), () => memory.listTiers());
export const listCooldowns = () => withStore("listCooldowns", () => persisted.listCooldowns(), () => memory.listCooldowns());
export const recordTest = (input: Parameters<typeof memory.recordTest>[0]) => withStore("recordTest", () => persisted.recordTest(input), () => memory.recordTest(input));
export const verifyDiscord = (input: Parameters<typeof memory.verifyDiscord>[0]) => withStore("verifyDiscord", () => persisted.verifyDiscord(input), () => memory.verifyDiscord(input));
export const getStats = () => withStore("getStats", () => persisted.getStats(), () => memory.getStats());
