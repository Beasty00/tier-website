"use client";

import Link from "next/link";
import { ExternalLink, Trophy, X } from "lucide-react";
import { motion } from "framer-motion";
import { ModeTierBadge } from "@/components/mode-tier-badge";
import { usePreferences } from "@/components/preferences";
import { GAMEMODES, type Player } from "@/lib/types";
import { cn, formatDate, regionTone, tierTone } from "@/lib/utils";

export function PlayerProfile({ player }: { player: Player }) {
  const { t } = usePreferences();
  const modes = [
    ...GAMEMODES,
    ...Object.keys(player.gamemodeTiers)
      .filter((slug) => !GAMEMODES.some((mode) => mode.slug === slug))
      .map((slug) => ({ id: `mode-${slug}`, slug, name: slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()), description: "Custom testing mode.", icon: slug.slice(0, 2).toUpperCase(), enabled: true }))
  ];

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.78fr_1.22fr]">
      <motion.aside
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="relative overflow-hidden rounded-[28px] border border-white/10 bg-card/95 p-7 shadow-card"
      >
        <Link href="/ranking" className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-400 transition hover:text-white">
          <X className="h-6 w-6" />
        </Link>
        <div className="ambient-orb pointer-events-none absolute left-1/2 top-4 h-48 w-48 -translate-x-1/2 rounded-full bg-diamond/10 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="grid h-32 w-32 place-items-center rounded-full bg-slate-800/70 shadow-glow">
            <img src={player.skin} alt={`${player.username} Minecraft head`} className="h-24 w-24 rounded-3xl pixelated" />
          </div>
          <h1 className="mt-4 font-display text-4xl font-black tracking-tight text-white">{player.username}</h1>
          <span className={cn("mt-4 rounded-full border px-5 py-2 text-sm font-black", tierTone(player.tier))}>
            {player.tier} {t("combatSpecialist")}
          </span>
          <p className={cn("mt-5 text-lg font-black", regionTone(player.region))}>{player.region}</p>
          <a
            href={`https://namemc.com/profile/${encodeURIComponent(player.username)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-diamond/40 hover:text-white"
          >
            {t("openNameMc")} <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="relative z-10 mt-8">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-zinc-400">{t("position")}</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-900/70">
            <div className="rank-slab inline-flex h-14 min-w-32 items-center bg-gradient-to-r from-slate-800 to-slate-950 px-4">
              <span className="font-display text-3xl font-black italic text-white">#{player.rank}</span>
            </div>
            <div className="inline-flex h-14 items-center gap-3 px-4 align-top">
              <Trophy className="h-5 w-5 text-gold" />
              <span className="font-display text-2xl font-black text-white">OVERALL</span>
              <span className="text-lg font-bold text-zinc-400">({player.points} {t("pointsLower")})</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-zinc-400">{t("tiers")}</p>
          <div className="mt-3 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/30 p-3">
            {modes.filter((mode) => mode.slug !== "overall").map((mode) => {
              const tier = player.gamemodeTiers[mode.slug];
              return <ModeTierBadge key={mode.slug} mode={mode} tier={tier} />;
            })}
          </div>
        </div>
      </motion.aside>

      <section className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-card border border-white/10 bg-card/90 p-6 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald">UUID</p>
              <p className="mt-2 break-all font-mono text-sm text-zinc-400">{player.uuid}</p>
            </div>
            <Link href="/ranking" className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-emerald/50 hover:text-white">{t("back")}</Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Metric label={t("region")} value={player.region} className={regionTone(player.region)} />
            <Metric label={t("rank")} value={`#${player.rank}`} />
            <Metric label={t("points")} value={player.points.toLocaleString()} />
            <Metric label={t("tester")} value={player.tester} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="rounded-card border border-white/10 bg-card/90 p-6 shadow-card">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-zinc-500">{t("history")}</p>
          <h2 className="mt-3 font-display text-3xl font-black text-white">{t("latestTests")}</h2>
          <div className="mt-6 space-y-3">
            {player.history.length ? player.history.map((test) => (
              <div key={test.id} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-white">{test.gamemode} {t("by")} {test.tester}</p>
                    <p className="mt-1 text-sm text-zinc-500">{formatDate(test.createdAt)} - {test.notes}</p>
                  </div>
                  <span className={cn("w-fit rounded-full border px-3 py-1 text-xs font-black", tierTone(test.tier))}>{test.tier}</span>
                </div>
              </div>
            )) : <p className="text-zinc-500">{t("noTestsRecorded")}</p>}
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function Metric({ label, value, className = "text-white" }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className={cn("mt-2 font-display text-2xl font-black", className)}>{value}</p>
    </div>
  );
}
