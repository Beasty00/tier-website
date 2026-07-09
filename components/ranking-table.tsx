"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { serverConfig } from "@/config";
import { ModeTierBadge } from "@/components/mode-tier-badge";
import { MinecraftItemIcon } from "@/components/minecraft-item-icon";
import { usePreferences } from "@/components/preferences";
import { GAMEMODES, REGIONS, TIERS, type Gamemode, type Player } from "@/lib/types";
import { cn, formatDate, regionTone, tierTone } from "@/lib/utils";

const pageSize = 100;
const tierGroups = [
  { number: 1, codes: ["HT1", "LT1"] },
  { number: 2, codes: ["HT2", "LT2"] },
  { number: 3, codes: ["HT3", "LT3"] },
  { number: 4, codes: ["HT4", "LT4"] },
  { number: 5, codes: ["HT5", "LT5"] }
] as const;

export function RankingTable({ players }: { players: Player[] }) {
  const { t } = usePreferences();
  const [livePlayers, setLivePlayers] = useState(players);
  const [gamemodes, setGamemodes] = useState<Gamemode[]>(GAMEMODES);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("ALL");
  const [gamemode, setGamemode] = useState("overall");
  const [tier, setTier] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;

    async function loadLiveData() {
      try {
        const [playersResponse, gamemodesResponse] = await Promise.all([
          fetch(`${serverConfig.apiUrl}/players?limit=100`, { cache: "no-store" }),
          fetch(`${serverConfig.apiUrl}/gamemodes`, { cache: "no-store" })
        ]);

        if (!active) return;
        if (playersResponse.ok) {
          const data = await playersResponse.json() as { items?: Player[] };
          if (Array.isArray(data.items)) setLivePlayers(data.items);
        }
        if (gamemodesResponse.ok) {
          const data = await gamemodesResponse.json() as Gamemode[];
          if (Array.isArray(data) && data.length > 0) setGamemodes(data.filter((mode) => mode.enabled));
        }
      } catch {
        // Seed data keeps the table usable when the API is not running.
      }
    }

    loadLiveData();
    const timer = window.setInterval(loadLiveData, 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const rankedPlayers = useMemo(() => rankWithTies(livePlayers), [livePlayers]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rankWithTies(
      rankedPlayers
        .filter((player) => !needle || player.username.toLowerCase().includes(needle) || player.uuid.toLowerCase().includes(needle))
        .filter((player) => region === "ALL" || player.region === region)
        .filter((player) => tier === "ALL" || (gamemode === "overall" ? player.tier : player.gamemodeTiers[gamemode]) === tier)
    );
  }, [rankedPlayers, search, region, gamemode, tier]);

  const activeMode = gamemodes.find((mode) => mode.slug === gamemode) || gamemodes[0] || GAMEMODES[0];
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function updateFilter(callback: () => void) {
    callback();
    setPage(1);
  }

  return (
    <div className="rounded-card border border-white/10 bg-card/90 p-4 shadow-card sm:p-6">
      <div className="ambient-orb pointer-events-none absolute right-10 top-24 h-28 w-28 rounded-full bg-emerald/10 blur-3xl" />
      <div className="mb-5 overflow-x-auto rounded-[22px_22px_0_0] border border-[#1a2532] bg-[#080e16]">
        <div className="flex min-w-max">
          {gamemodes.map((mode, index) => (
            <motion.button
              key={mode.slug}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.025 }}
              onClick={() => updateFilter(() => setGamemode(mode.slug))}
              className={cn(
                "relative flex h-[70px] min-w-[116px] flex-col items-center justify-center gap-1 border-r border-[#1a2532] px-5 pb-2 pt-3 text-sm font-black transition last:border-r-0",
                gamemode === mode.slug
                  ? "bg-[#111a27] text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-white"
                  : "text-[#3e4a5f] hover:bg-[#0d1520] hover:text-[#7f8ca3]"
              )}
            >
              <MinecraftItemIcon slug={mode.slug} size="tab" variant="plain" />
              {mode.name}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.7fr]">
        <input
          value={search}
          onChange={(event) => updateFilter(() => setSearch(event.target.value))}
          placeholder={t("search")}
          className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald/60"
        />
        <select value={region} onChange={(event) => updateFilter(() => setRegion(event.target.value))} className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-emerald/60">
          <option value="ALL">{t("allRegions")}</option>
          {REGIONS.map((item) => <option key={item.code} value={item.code}>{item.code}</option>)}
        </select>
        <select value={tier} onChange={(event) => updateFilter(() => setTier(event.target.value))} className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-emerald/60">
          <option value="ALL">{t("allTiers")}</option>
          {TIERS.map((item) => <option key={item.code} value={item.code}>{item.code}</option>)}
        </select>
      </div>

      {gamemode !== "overall" && (
        <GamemodeTierBoard mode={activeMode} players={filtered} />
      )}

      {gamemode === "overall" && (
        <div className="mt-6 overflow-hidden rounded-[18px] border border-white/10">
          <div className="hidden grid-cols-[176px_minmax(0,1fr)_92px_100px_minmax(0,1.55fr)] bg-white/[0.04] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-zinc-500 md:grid">
            <span>#</span>
            <span>{t("player")}</span>
            <span>{t("region")}</span>
            <span>{t("points")}</span>
            <span>{t("gamemodeTiers")}</span>
          </div>
          <div className="divide-y divide-white/10">
            {rows.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.018, 0.18) }}
              >
                <Link href={`/player/${player.username}`} className="ranking-row grid gap-4 px-4 py-4 transition hover:bg-white/[0.04] md:grid-cols-[176px_minmax(0,1fr)_92px_100px_minmax(0,1.55fr)] md:items-center md:px-5">
                  <RankSlab rank={player.rank} username={player.username} />
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-bold text-white">
                      {player.username}
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]", tierTone(player.tier))}>{player.tier}</span>
                    </p>
                    <p className="text-xs text-zinc-500">{formatDate(player.lastTestAt)} / {player.points} {t("pointsLower")}</p>
                  </div>
                  <span className={cn("w-fit rounded-lg bg-diamond/10 px-3 py-1 text-xs font-black", regionTone(player.region))}>{player.region}</span>
                  <span className="font-mono text-zinc-200">{player.points.toLocaleString()}</span>
                  <ModeTierBadges player={player} modes={gamemodes} activeMode={gamemode} />
                </Link>
              </motion.div>
            ))}
            {rows.length === 0 && <div className="px-5 py-12 text-center text-zinc-500">{t("noPlayersMatch")}</div>}
          </div>
        </div>
      )}

      {gamemode === "overall" && (
        <div className="mt-5 flex flex-col gap-3 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{filtered.length} {t("playersFound")}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-full border border-white/10 px-4 py-2 font-bold text-zinc-300 transition hover:border-emerald/40 hover:text-white">{t("prev")}</button>
            <span>{t("page")} {currentPage} / {totalPages}</span>
            <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-full border border-white/10 px-4 py-2 font-bold text-zinc-300 transition hover:border-emerald/40 hover:text-white">{t("next")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function RankSlab({ rank, username }: { rank: number; username: string }) {
  const tone = rank === 1
    ? "from-[#f0c24e] via-[#d7a734] to-[#916514]"
    : rank === 2
      ? "from-[#dfe6ee] via-[#9aa4b2] to-[#4a5568]"
      : rank === 3
        ? "from-[#f5a14b] via-[#bd6820] to-[#6f3510]"
        : "from-[#2a3140] via-[#171d29] to-[#05070a]";
  const rankSize = rank >= 100 ? "text-[22px]" : rank >= 10 ? "text-[26px]" : "text-[30px]";

  return (
    <div className="rank-slab relative h-[64px] w-[164px] shrink-0 overflow-hidden rounded-[2px] bg-[#05070a] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_10px_22px_rgba(0,0,0,0.28)]">
      <div className={cn("rank-slab-fill absolute inset-y-0 left-0 w-[156px] bg-gradient-to-r", tone)} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,transparent_58%,rgba(0,0,0,0.28)_100%)]" />
      <span className={cn("absolute left-4 top-1/2 z-10 -translate-y-1/2 font-display font-black italic leading-none text-[#fff] [text-shadow:0_3px_0_rgba(0,0,0,0.18),0_7px_16px_rgba(0,0,0,0.4)]", rankSize)}>
        {rank}.
      </span>
      <img
        src={`https://mc-heads.net/body/${encodeURIComponent(username)}/96`}
        alt=""
        className="pixelated absolute bottom-[2px] right-[16px] z-20 h-[60px] w-auto object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]"
      />
    </div>
  );
}

function ModeTierBadges({ player, modes, activeMode }: { player: Player; modes: Gamemode[]; activeMode: string }) {
  const visibleModes = modes.filter((mode) => mode.slug !== "overall");

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleModes.map((mode) => {
        const tier = player.gamemodeTiers[mode.slug];
        const active = activeMode === mode.slug;
        return <ModeTierBadge key={mode.slug} mode={mode} tier={tier} active={active} />;
      })}
    </div>
  );
}

function GamemodeTierBoard({ mode, players }: { mode: Gamemode; players: Player[] }) {
  const { t } = usePreferences();
  const tested = players.filter((player) => Boolean(player.gamemodeTiers[mode.slug]));

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[18px] border border-white/10 bg-black/30 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <MinecraftItemIcon slug={mode.slug} size="lg" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald">{mode.name}</p>
              <h3 className="font-display text-3xl font-black text-white">{t("tierBoard")}</h3>
            </div>
          </div>
        </div>
        <span className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-zinc-400">{tested.length} {t("testedPlayers")}</span>
      </div>
      <div className="grid gap-3 xl:grid-cols-5">
        {tierGroups.map((group) => {
          const groupPlayers = tested.filter((player) => (group.codes as readonly string[]).includes(player.gamemodeTiers[mode.slug]));
          return (
            <div key={group.number} className="overflow-hidden rounded-2xl border border-white/10 bg-panel/70">
              <div className="border-b border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="font-display text-xl font-black text-white">{t("tier")} {group.number}</p>
              </div>
              <div className="max-h-[520px] space-y-1 overflow-y-auto p-2">
                {groupPlayers.map((player) => {
                  const playerTier = player.gamemodeTiers[mode.slug];
                  return (
                    <Link key={player.id} href={`/player/${player.username}`} className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-slate-800/60 p-2 transition hover:border-emerald/40 hover:bg-emerald/10">
                      <span className="flex min-w-0 items-center gap-2">
                        <img src={player.skin} alt="" className="h-8 w-8 rounded-lg pixelated" />
                        <span className="truncate text-sm font-bold text-white">{player.username}</span>
                      </span>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black", tierTone(playerTier))}>{playerTier}</span>
                    </Link>
                  );
                })}
                {groupPlayers.length === 0 && <p className="px-2 py-6 text-center text-xs text-zinc-600">{t("noTestedPlayers")}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

function rankWithTies(players: Player[]) {
  const sorted = [...players].sort((left, right) => right.points - left.points || left.username.localeCompare(right.username));
  let previousPoints: number | null = null;
  let previousRank = 0;

  return sorted.map((player, index) => {
    const rank = previousPoints === player.points ? previousRank : index + 1;
    previousPoints = player.points;
    previousRank = rank;
    return { ...player, rank };
  });
}
