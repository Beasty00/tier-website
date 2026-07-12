export type RegionCode = "EU" | "NA" | "AS" | "AU";
export type TierCode = "HT1" | "LT1" | "HT2" | "LT2" | "HT3" | "LT3" | "HT4" | "LT4" | "HT5" | "LT5";

export type Gamemode = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
};

export type Region = {
  id: string;
  code: RegionCode;
  name: string;
  enabled: boolean;
};

export type Tier = {
  id: string;
  code: TierCode;
  label: string;
  order: number;
  pointsMin: number;
};

export type Tester = {
  id: string;
  name: string;
  discordId?: string;
  region: RegionCode;
  active: boolean;
  gamemodes: string[];
};

export type TestResult = {
  id: string;
  username: string;
  region: RegionCode;
  gamemode: string;
  tester: string;
  tier: TierCode;
  notes: string;
  createdAt: string;
};

export type Player = {
  id: string;
  uuid: string;
  username: string;
  skin: string;
  region: RegionCode;
  points: number;
  rank: number;
  tier: TierCode;
  tester: string;
  createdAt: string;
  lastTestAt: string;
  gamemodeTiers: Record<string, TierCode>;
  history: TestResult[];
};

export type QueueEntry = {
  id: string;
  username: string;
  uuid?: string;
  discordId?: string;
  region: RegionCode;
  gamemode: string;
  priority: number;
  position: number;
  status: "WAITING" | "ACTIVE";
  joinedAt: string;
  estimatedMinutes: number;
};

export type WaitlistEntry = Omit<QueueEntry, "status" | "estimatedMinutes"> & {
  notified: boolean;
};

export const REGIONS: Region[] = [
  { id: "region-eu", code: "EU", name: "Europe", enabled: true },
  { id: "region-na", code: "NA", name: "North America", enabled: true },
  { id: "region-as", code: "AS", name: "Asia", enabled: true },
  { id: "region-au", code: "AU", name: "Australia", enabled: true }
];

export const TIERS: Tier[] = [
  { id: "tier-ht1", code: "HT1", label: "High Tier 1", order: 1, pointsMin: 2400 },
  { id: "tier-lt1", code: "LT1", label: "Low Tier 1", order: 2, pointsMin: 2200 },
  { id: "tier-ht2", code: "HT2", label: "High Tier 2", order: 3, pointsMin: 2000 },
  { id: "tier-lt2", code: "LT2", label: "Low Tier 2", order: 4, pointsMin: 1800 },
  { id: "tier-ht3", code: "HT3", label: "High Tier 3", order: 5, pointsMin: 1600 },
  { id: "tier-lt3", code: "LT3", label: "Low Tier 3", order: 6, pointsMin: 1400 },
  { id: "tier-ht4", code: "HT4", label: "High Tier 4", order: 7, pointsMin: 1200 },
  { id: "tier-lt4", code: "LT4", label: "Low Tier 4", order: 8, pointsMin: 1000 },
  { id: "tier-ht5", code: "HT5", label: "High Tier 5", order: 9, pointsMin: 800 },
  { id: "tier-lt5", code: "LT5", label: "Low Tier 5", order: 10, pointsMin: 600 }
];

export const GAMEMODES: Gamemode[] = [
  { id: "mode-overall", slug: "overall", name: "Overall", description: "Global score across every supported mode.", icon: "OV", enabled: true },
  { id: "mode-ltms", slug: "ltms", name: "LTMs", description: "Limited-time and special event modes.", icon: "LT", enabled: true },
  { id: "mode-vanilla", slug: "vanilla", name: "Vanilla", description: "Default survival PvP mechanics.", icon: "VA", enabled: true },
  { id: "mode-uhc", slug: "uhc", name: "UHC", description: "No natural regeneration, resource-heavy fights.", icon: "UH", enabled: true },
  { id: "mode-pot", slug: "pot", name: "Pot", description: "Potion PvP with fast reset windows.", icon: "PO", enabled: true },
  { id: "mode-nethop", slug: "nethop", name: "NethOP", description: "Netherite OP kit testing.", icon: "NO", enabled: true },
  { id: "mode-smp", slug: "smp", name: "SMP", description: "SMP-realistic combat scenarios.", icon: "SM", enabled: true },
  { id: "mode-sword", slug: "sword", name: "Sword", description: "Sword-only mechanical testing.", icon: "SW", enabled: true },
  { id: "mode-axe", slug: "axe", name: "Axe", description: "Axe and shield pressure testing.", icon: "AX", enabled: true },
  { id: "mode-mace", slug: "mace", name: "Mace", description: "Modern mace burst and movement testing.", icon: "MC", enabled: true },
  { id: "mode-spear", slug: "spear", name: "Spear", description: "Spear reach and poke-control testing.", icon: "SP", enabled: true }
];
