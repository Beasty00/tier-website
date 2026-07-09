"use client";

import Link from "next/link";
import { Activity, Clock, Layers3, ShieldCheck, Trophy, Users } from "lucide-react";
import { HeroMotion, Lift, Reveal } from "@/components/animated";
import { PixelLogo } from "@/components/pixel-logo";
import { usePreferences } from "@/components/preferences";
import { RankingTable } from "@/components/ranking-table";
import { StatCard } from "@/components/stat-card";
import { serverConfig } from "@/config";
import { getStats, seedGamemodes, seedPlayers, seedQueue, seedTesters } from "@/lib/seed";
import { cn, tierTone } from "@/lib/utils";

export default function HomePage() {
  const { t } = usePreferences();
  const stats = getStats();
  const featureCards = [
    { title: t("featureModesTitle"), text: t("featureModesText") },
    { title: t("featureQueueTitle"), text: t("featureQueueText") },
    { title: t("featureTesterTitle"), text: t("featureTesterText") },
    { title: t("featureAdminTitle"), text: t("featureAdminText") }
  ];

  return (
    <main className="minecraft-grid overflow-hidden">
      <section className="relative mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald/10 blur-3xl" />
        <HeroMotion>
          <div className="relative z-10">
            <PixelLogo />
            <div className="mt-8 inline-flex rounded-full border border-emerald/30 bg-emerald/10 px-4 py-2 text-sm font-black uppercase tracking-[0.22em] text-emerald">
              {t("homeBadge")}
            </div>
            <h1 className="mt-7 max-w-4xl font-display text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white sm:text-7xl lg:text-8xl">
              {t("homeTitle")}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl">
              {t("homeSubtitle")}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/ranking" className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald px-6 py-4 font-black text-black shadow-glow transition hover:scale-[1.03]">
                {t("getStarted")} <span className="transition group-hover:translate-x-1">-&gt;</span>
              </Link>
              <a href={serverConfig.discordLink} className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 font-black text-white transition hover:border-diamond/50 hover:bg-diamond/10">
                {t("joinDiscord")}
              </a>
            </div>
          </div>
        </HeroMotion>

        <Reveal className="relative z-10">
          <div className="rounded-card border border-white/10 bg-card/85 p-4 shadow-card backdrop-blur-xl sm:p-6">
            <div className="rounded-[18px] border border-white/10 bg-black/40 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">{t("topRanked")}</p>
                  <h2 className="mt-2 font-display text-3xl font-black text-white">{t("liveLeaderboard")}</h2>
                </div>
                <Trophy className="h-8 w-8 text-gold" />
              </div>
              <div className="space-y-3">
                {seedPlayers.slice(0, 4).map((player) => (
                  <Link key={player.id} href={`/player/${player.username}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-emerald/40 hover:bg-emerald/10">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-2xl font-black text-white">#{player.rank}</span>
                      <img src={player.skin} alt="" className="h-10 w-10 rounded-xl pixelated" />
                      <div>
                        <p className="font-bold text-white">{player.username}</p>
                        <p className="text-xs text-zinc-500">{player.region} / {player.points} {t("pointsLower")}</p>
                      </div>
                    </div>
                    <span className={cn("rounded-full border px-3 py-1 text-xs font-black", tierTone(player.tier))}>{player.tier}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Reveal><StatCard label={t("players")} value={stats.players} detail={t("verifiedMinecraftProfiles")} icon={<Users className="h-5 w-5" />} /></Reveal>
          <Reveal delay={0.05}><StatCard label={t("tests")} value={stats.tests} detail={t("storedTierTestResults")} icon={<Activity className="h-5 w-5" />} /></Reveal>
          <Reveal delay={0.1}><StatCard label={t("queue")} value={stats.queued} detail={t("playersWaitingNow")} icon={<Clock className="h-5 w-5" />} /></Reveal>
          <Reveal delay={0.15}><StatCard label={t("gamemodes")} value={stats.gamemodes} detail={t("autoSyncedEverywhere")} icon={<Layers3 className="h-5 w-5" />} /></Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald">{t("systemModules")}</p>
          <h2 className="mt-4 font-display text-4xl font-black tracking-tight text-white sm:text-6xl">{t("modulesTitle")}</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature, index) => (
            <Lift key={feature.title} className="h-full">
              <div className="h-full rounded-card border border-white/10 bg-card/85 p-6 shadow-card">
                <span className="font-mono text-sm font-black text-emerald">0{index + 1}</span>
                <h3 className="mt-5 font-display text-2xl font-black text-white">{feature.title}</h3>
                <p className="mt-4 text-sm leading-6 text-zinc-400">{feature.text}</p>
              </div>
            </Lift>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-zinc-500">{t("rankingPreview")}</p>
            <h2 className="mt-3 font-display text-4xl font-black text-white">{t("rankingPreviewTitle")}</h2>
          </div>
          <Link href="/ranking" className="w-fit rounded-full border border-white/10 px-5 py-3 font-bold text-zinc-200 transition hover:border-emerald/40 hover:text-white">{t("openFullRanking")}</Link>
        </Reveal>
        <RankingTable players={seedPlayers} />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="rounded-card border border-white/10 bg-card/90 p-7 shadow-card">
              <ShieldCheck className="h-10 w-10 text-emerald" />
              <h2 className="mt-6 font-display text-4xl font-black text-white">{t("testerWorkflowTitle")}</h2>
              <p className="mt-4 text-zinc-400">{t("testerWorkflowText")}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {seedTesters.map((tester) => <span key={tester.id} className="rounded-full border border-white/10 px-3 py-1 text-sm text-zinc-300">{tester.name} / {tester.region}</span>)}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="rounded-card border border-white/10 bg-card/90 p-7 shadow-card">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-zinc-500">{t("queueSnapshot")}</p>
              <div className="mt-5 space-y-3">
                {seedQueue.map((entry) => <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/35 p-4"><span className="font-bold text-white">#{entry.position} {entry.username}</span><span className="text-sm text-zinc-400">{entry.gamemode} / ~{entry.estimatedMinutes}m</span></div>)}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-card border border-emerald/20 bg-emerald/[0.08] p-8 text-center shadow-glow sm:p-12">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald">{t("deploymentReady")}</p>
            <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-black text-white sm:text-6xl">{t("deploymentTitle")}</h2>
            <p className="mx-auto mt-5 max-w-2xl text-zinc-300">{t("deploymentText")}</p>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
