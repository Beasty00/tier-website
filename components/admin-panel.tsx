"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { serverConfig } from "@/config";
import { usePreferences } from "@/components/preferences";
import { GAMEMODES, REGIONS, TIERS, type Gamemode, type Player, type QueueEntry, type Region, type RegionCode, type Tester, type WaitlistEntry } from "@/lib/types";
import { seedPlayers, seedQueue, seedTesters, seedWaitlist } from "@/lib/seed";
import { authHeader, getStoredRole, getStoredUsername } from "@/lib/auth-client";
import { cn, tierTone } from "@/lib/utils";

const tabs = [
  { id: "dashboard", labelKey: "dashboard" },
  { id: "players", labelKey: "adminPlayers" },
  { id: "recordTest", labelKey: "recordTest" },
  { id: "tiers", labelKey: "adminTiers" },
  { id: "queue", labelKey: "adminQueue" },
  { id: "waitlist", labelKey: "adminWaitlist" },
  { id: "tester", labelKey: "adminTester" },
  { id: "regions", labelKey: "adminRegions" },
  { id: "gamemodes", labelKey: "adminGamemodes" },
  { id: "cooldowns", labelKey: "adminCooldowns" },
  { id: "discord", labelKey: "adminDiscord" }
] as const;

type NewMode = { name: string; slug: string; description: string };
type NewTester = { name: string; region: RegionCode; discordId: string; gamemodes: string };
type NewTest = { username: string; region: RegionCode; gamemode: string; tier: string; notes: string };
type StatsPayload = {
  players: number;
  tests: number;
  queued: number;
  waitlisted: number;
  activeTesters: number;
  gamemodes: number;
};
type CooldownPayload = { id: string; username: string; gamemode?: string; scope: string; expiresAt: string };

export function AdminPanel() {
  const { t, tf } = usePreferences();
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("dashboard");
  const [players, setPlayers] = useState<Player[]>(seedPlayers);
  const [queue, setQueue] = useState<QueueEntry[]>(seedQueue);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(seedWaitlist);
  const [regions, setRegions] = useState<Region[]>(REGIONS);
  const [gamemodes, setGamemodes] = useState<Gamemode[]>(GAMEMODES);
  const [testers, setTesters] = useState<Tester[]>(seedTesters);
  const [cooldowns, setCooldowns] = useState<CooldownPayload[]>([]);
  const [statsPayload, setStatsPayload] = useState<StatsPayload | null>(null);
  const [newMode, setNewMode] = useState<NewMode>({ name: "", slug: "", description: "" });
  const [newTester, setNewTester] = useState<NewTester>({ name: "", region: "EU", discordId: "", gamemodes: "overall" });
  const [newPlayer, setNewPlayer] = useState<{ username: string; region: RegionCode; tier: string }>({ username: "", region: "EU", tier: "LT5" });
  const [newTest, setNewTest] = useState<NewTest>({ username: "", region: "EU", gamemode: "overall", tier: "LT5", notes: "" });
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);
  const [role, setRole] = useState<"USER" | "TESTER" | "ADMIN" | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);

  const stats = useMemo(() => [
    { label: t("players"), value: statsPayload?.players ?? players.length },
    { label: t("tests"), value: statsPayload?.tests ?? players.reduce((sum, player) => sum + player.history.length, 0) },
    { label: t("queue"), value: statsPayload?.queued ?? queue.length },
    { label: t("waitlist"), value: statsPayload?.waitlisted ?? waitlist.length },
    { label: t("activeTesters"), value: testers.filter((tester) => tester.active).length },
    { label: t("gamemodes"), value: gamemodes.filter((mode) => mode.enabled).length }
  ], [gamemodes, players, queue, statsPayload, t, testers, waitlist]);

  async function refreshAdminData() {
    try {
      const [playersResponse, queueResponse, gamemodesResponse, testersResponse, regionsResponse, cooldownsResponse, statsResponse] = await Promise.all([
        fetch(`${serverConfig.apiUrl}/players?limit=100`, { cache: "no-store" }),
        fetch(`${serverConfig.apiUrl}/queue`, { cache: "no-store" }),
        fetch(`${serverConfig.apiUrl}/gamemodes`, { cache: "no-store" }),
        fetch(`${serverConfig.apiUrl}/testers`, { cache: "no-store" }),
        fetch(`${serverConfig.apiUrl}/regions`, { cache: "no-store" }),
        fetch(`${serverConfig.apiUrl}/cooldowns`, { cache: "no-store" }),
        fetch(`${serverConfig.apiUrl}/stats`, { cache: "no-store" })
      ]);

      if (playersResponse.ok) {
        const data = await playersResponse.json() as { items?: Player[] };
        if (Array.isArray(data.items)) setPlayers(data.items);
      }
      if (queueResponse.ok) {
        const data = await queueResponse.json() as { queue?: QueueEntry[]; waitlist?: WaitlistEntry[] };
        if (Array.isArray(data.queue)) setQueue(data.queue);
        if (Array.isArray(data.waitlist)) setWaitlist(data.waitlist);
      }
      if (gamemodesResponse.ok) {
        const data = await gamemodesResponse.json() as Gamemode[];
        if (Array.isArray(data)) setGamemodes(data);
      }
      if (testersResponse.ok) {
        const data = await testersResponse.json() as Tester[];
        if (Array.isArray(data)) setTesters(data);
      }
      if (regionsResponse.ok) {
        const data = await regionsResponse.json() as Region[];
        if (Array.isArray(data)) setRegions(data);
      }
      if (cooldownsResponse.ok) {
        const data = await cooldownsResponse.json() as CooldownPayload[];
        if (Array.isArray(data)) setCooldowns(data);
      }
      if (statsResponse.ok) setStatsPayload(await statsResponse.json() as StatsPayload);
    } catch {
      // The seeded admin view remains usable without the API.
    }
  }

  useEffect(() => {
    setRole(getStoredRole());
    setRoleChecked(true);
  }, []);

  useEffect(() => {
    if (role !== "ADMIN") return;
    refreshAdminData();
    const timer = window.setInterval(refreshAdminData, 30_000);
    return () => window.clearInterval(timer);
  }, [role]);

  async function createMode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newMode.name.trim()) return;
    const slug = (newMode.slug || newMode.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (gamemodes.some((mode) => mode.slug === slug)) return;
    const optimistic = { id: `mode-${slug}`, slug, name: newMode.name.trim(), description: newMode.description || t("customTestingMode"), icon: slug.slice(0, 2).toUpperCase(), enabled: true };
    setGamemodes((items) => [...items, optimistic]);
    try {
      const response = await fetch(`${serverConfig.apiUrl}/gamemodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(optimistic)
      });
      if (response.ok) await refreshAdminData();
    } catch {
      // Optimistic local change is enough when the API is offline.
    }
    setNewMode({ name: "", slug: "", description: "" });
  }

  async function removeMode(slug: string) {
    setGamemodes((items) => items.filter((mode) => mode.slug !== slug));
    try {
      await fetch(`${serverConfig.apiUrl}/gamemodes/${encodeURIComponent(slug)}`, { method: "DELETE", headers: authHeader() });
      await refreshAdminData();
    } catch {
      // Local fallback already updated the view.
    }
  }

  async function createPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newPlayer.username.trim()) return;
    try {
      const response = await fetch(`${serverConfig.apiUrl}/player`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ username: newPlayer.username.trim(), region: newPlayer.region, tier: newPlayer.tier })
      });
      if (response.ok) await refreshAdminData();
    } catch {
      // Ignore — refreshAdminData already ran on success; nothing to roll back optimistically here.
    }
    setNewPlayer({ username: "", region: "EU", tier: "LT5" });
  }

  async function removePlayer(id: string) {
    setPlayers((items) => items.filter((player) => player.id !== id));
    try {
      await fetch(`${serverConfig.apiUrl}/player/${encodeURIComponent(id)}`, { method: "DELETE", headers: authHeader() });
      await refreshAdminData();
    } catch {
      // Local fallback already updated the view.
    }
  }

  async function submitTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTest.username.trim()) return;
    setTestSubmitting(true);
    setTestFeedback(null);
    try {
      const response = await fetch(`${serverConfig.apiUrl}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          username: newTest.username.trim(),
          region: newTest.region,
          gamemode: newTest.gamemode,
          tier: newTest.tier,
          notes: newTest.notes || undefined,
          tester: getStoredUsername() || "System"
        })
      });
      if (response.ok) {
        setTestFeedback(t("testRecorded"));
        await refreshAdminData();
        setNewTest((value) => ({ ...value, username: "", notes: "" }));
      } else {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        setTestFeedback(body?.error || t("testFailed"));
      }
    } catch {
      setTestFeedback(t("testFailed"));
    } finally {
      setTestSubmitting(false);
    }
  }

  async function toggleMode(mode: Gamemode) {
    setGamemodes((items) => items.map((item) => item.id === mode.id ? { ...item, enabled: !item.enabled } : item));
    try {
      await fetch(`${serverConfig.apiUrl}/gamemodes/${encodeURIComponent(mode.slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ enabled: !mode.enabled })
      });
      await refreshAdminData();
    } catch {
      // Local fallback already updated the view.
    }
  }

  async function createTester(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTester.name.trim()) return;
    const payload = {
      name: newTester.name.trim(),
      region: newTester.region,
      discordId: newTester.discordId.trim() || undefined,
      active: true,
      gamemodes: newTester.gamemodes.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean)
    };
    const optimistic: Tester = { id: `tester-${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, ...payload };
    setTesters((items) => [...items, optimistic]);
    try {
      const response = await fetch(`${serverConfig.apiUrl}/testers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload)
      });
      if (response.ok) await refreshAdminData();
    } catch {
      // Optimistic local change is enough when the API is offline.
    }
    setNewTester({ name: "", region: "EU", discordId: "", gamemodes: "overall" });
  }

  async function toggleTester(id: string) {
    const current = testers.find((tester) => tester.id === id);
    if (!current) return;
    setTesters((items) => items.map((tester) => tester.id === id ? { ...tester, active: !tester.active } : tester));
    try {
      await fetch(`${serverConfig.apiUrl}/testers/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ active: !current.active })
      });
      await refreshAdminData();
    } catch {
      // Local fallback already updated the view.
    }
  }

  async function removeTester(id: string) {
    setTesters((items) => items.filter((tester) => tester.id !== id));
    try {
      await fetch(`${serverConfig.apiUrl}/testers/${encodeURIComponent(id)}`, { method: "DELETE", headers: authHeader() });
      await refreshAdminData();
    } catch {
      // Local fallback already updated the view.
    }
  }

  if (!roleChecked) {
    return (
      <div className="rounded-card border border-white/10 bg-card/90 p-8 text-center text-zinc-400 shadow-card">
        {t("checkingDiscordLoginToken")}
      </div>
    );
  }

  if (role !== "ADMIN") {
    return (
      <div className="rounded-card border border-lava/30 bg-lava/10 p-8 text-center shadow-card">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-lava">{t("accessDenied")}</p>
        <p className="mt-3 text-sm text-zinc-300">{t("adminAccessDeniedText")}</p>
        <a
          href={`${serverConfig.apiUrl}/auth/discord`}
          className="mt-5 inline-flex rounded-full bg-emerald px-5 py-3 text-sm font-black text-black shadow-glow transition hover:scale-[1.03]"
        >
          {t("login")}
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
      <aside className="rounded-card border border-white/10 bg-card/90 p-3 shadow-card lg:sticky lg:top-24 lg:h-fit">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActive(tab.id)} className={cn("mb-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold transition", active === tab.id ? "bg-emerald text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white")}>
            {t(tab.labelKey)}
            <span className="text-xs opacity-70">ADMIN</span>
          </button>
        ))}
      </aside>

      <motion.section key={active} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-card border border-white/10 bg-card/90 p-5 shadow-card sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald">{t("adminPanel")}</p>
            <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-white">{t(tabs.find((tab) => tab.id === active)?.labelKey || "adminPanel")}</h1>
          </div>
          <span className="w-fit rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-zinc-400">{t("jwtReady")}</span>
        </div>

        {active === "dashboard" && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/35 p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">{item.label}</p>
                <p className="mt-3 font-display text-4xl font-black text-white">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {active === "players" && (
          <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <form onSubmit={createPlayer} className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="font-bold text-white">{t("addPlayer")}</p>
              <div className="mt-4 grid gap-3">
                <input
                  value={newPlayer.username}
                  onChange={(event) => setNewPlayer((value) => ({ ...value, username: event.target.value }))}
                  placeholder={t("username")}
                  className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60"
                />
                <select
                  value={newPlayer.region}
                  onChange={(event) => setNewPlayer((value) => ({ ...value, region: event.target.value as RegionCode }))}
                  className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60"
                >
                  {regions.map((region) => <option key={region.code} value={region.code}>{region.code} - {region.name}</option>)}
                </select>
                <select
                  value={newPlayer.tier}
                  onChange={(event) => setNewPlayer((value) => ({ ...value, tier: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60"
                >
                  {TIERS.map((tier) => <option key={tier.code} value={tier.code}>{tier.code} - {tier.label}</option>)}
                </select>
                <button className="rounded-2xl bg-emerald px-5 py-3 font-black text-black shadow-glow">{t("addPlayer")}</button>
              </div>
            </form>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              {players.length === 0 && (
                <div className="p-4 text-sm text-zinc-500">{t("noPlayersYet")}</div>
              )}
              {players.map((player) => (
                <div key={player.id} className="grid gap-3 border-b border-white/10 bg-black/25 p-4 last:border-b-0 sm:grid-cols-[1fr_0.5fr_0.5fr_0.5fr_auto] sm:items-center">
                  <span className="font-bold text-white">{player.username}</span>
                  <span className="text-zinc-400">{player.region}</span>
                  <span className="text-zinc-400">#{player.rank}</span>
                  <span className={cn("w-fit rounded-full border px-3 py-1 text-xs font-black", tierTone(player.tier))}>{player.tier}</span>
                  <button onClick={() => removePlayer(player.id)} className="rounded-full border border-lava/40 px-4 py-2 text-sm font-black text-lava transition hover:bg-lava/10">{t("delete")}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {active === "recordTest" && (
          <div className="mt-8 max-w-xl">
            <form onSubmit={submitTest} className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="font-bold text-white">{t("recordTest")}</p>
              <p className="mt-1 text-sm text-zinc-500">{t("recordTestHint")}</p>
              <div className="mt-4 grid gap-3">
                <input
                  value={newTest.username}
                  onChange={(event) => setNewTest((value) => ({ ...value, username: event.target.value }))}
                  placeholder={t("username")}
                  className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60"
                />
                <select
                  value={newTest.region}
                  onChange={(event) => setNewTest((value) => ({ ...value, region: event.target.value as RegionCode }))}
                  className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60"
                >
                  {regions.map((region) => <option key={region.code} value={region.code}>{region.code} - {region.name}</option>)}
                </select>
                <select
                  value={newTest.gamemode}
                  onChange={(event) => setNewTest((value) => ({ ...value, gamemode: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60"
                >
                  {gamemodes.map((mode) => <option key={mode.slug} value={mode.slug}>{mode.name}</option>)}
                </select>
                <select
                  value={newTest.tier}
                  onChange={(event) => setNewTest((value) => ({ ...value, tier: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60"
                >
                  {TIERS.map((tier) => <option key={tier.code} value={tier.code}>{tier.code} - {tier.label}</option>)}
                </select>
                <textarea
                  value={newTest.notes}
                  onChange={(event) => setNewTest((value) => ({ ...value, notes: event.target.value }))}
                  placeholder={t("notesOptional")}
                  className="min-h-24 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60"
                />
                <button disabled={testSubmitting} className="rounded-2xl bg-emerald px-5 py-3 font-black text-black shadow-glow disabled:opacity-50">
                  {testSubmitting ? t("submitting") : t("recordTest")}
                </button>
                {testFeedback && <p className="text-sm text-zinc-300">{testFeedback}</p>}
              </div>
            </form>
          </div>
        )}

        {active === "tiers" && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {TIERS.map((tier) => <div key={tier.code} className={cn("rounded-2xl border p-5", tierTone(tier.code))}><p className="font-display text-3xl font-black">{tier.code}</p><p className="mt-2 text-sm opacity-80">{tf("minPoints", { points: tier.pointsMin })}</p></div>)}
          </div>
        )}

        {active === "queue" && <SimpleList items={queue.map((entry) => `#${entry.position} ${entry.username} - ${entry.region} - ${entry.gamemode}`)} />}
        {active === "waitlist" && <SimpleList items={waitlist.map((entry) => `#${entry.position} ${entry.username} - ${entry.region} - ${entry.gamemode}`)} />}

        {active === "tester" && (
          <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <form onSubmit={createTester} className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="font-bold text-white">{t("addTester")}</p>
              <div className="mt-4 grid gap-3">
                <input value={newTester.name} onChange={(event) => setNewTester((value) => ({ ...value, name: event.target.value }))} placeholder={t("testerName")} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60" />
                <input value={newTester.discordId} onChange={(event) => setNewTester((value) => ({ ...value, discordId: event.target.value }))} placeholder={t("discordIdOptional")} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60" />
                <select value={newTester.region} onChange={(event) => setNewTester((value) => ({ ...value, region: event.target.value as RegionCode }))} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60">
                  {regions.map((region) => <option key={region.code} value={region.code}>{region.code} - {region.name}</option>)}
                </select>
                <input value={newTester.gamemodes} onChange={(event) => setNewTester((value) => ({ ...value, gamemodes: event.target.value }))} placeholder="overall, vanilla, sword" className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60" />
                <button className="rounded-2xl bg-emerald px-5 py-3 font-black text-black shadow-glow">{t("addTester")}</button>
              </div>
            </form>
            <div className="space-y-3">
              {testers.map((tester) => (
                <div key={tester.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-white">{tester.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">{tester.region} - {tester.gamemodes.join(", ")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => toggleTester(tester.id)} className={cn("rounded-full px-4 py-2 text-sm font-black", tester.active ? "bg-emerald text-black" : "border border-white/10 text-zinc-300")}>{tester.active ? t("active") : t("inactive")}</button>
                    <button onClick={() => removeTester(tester.id)} className="rounded-full border border-lava/40 px-4 py-2 text-sm font-black text-lava transition hover:bg-lava/10">{t("delete")}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {active === "regions" && <SimpleList items={regions.map((region) => `${region.code} - ${region.name} - ${region.enabled ? t("enabled") : t("disabled")}`)} />}

        {active === "gamemodes" && (
          <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <form onSubmit={createMode} className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="font-bold text-white">{t("createGamemode")}</p>
              <div className="mt-4 grid gap-3">
                <input value={newMode.name} onChange={(event) => setNewMode((value) => ({ ...value, name: event.target.value }))} placeholder={t("name")} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60" />
                <input value={newMode.slug} onChange={(event) => setNewMode((value) => ({ ...value, slug: event.target.value }))} placeholder={t("slug")} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60" />
                <textarea value={newMode.description} onChange={(event) => setNewMode((value) => ({ ...value, description: event.target.value }))} placeholder={t("description")} className="min-h-28 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60" />
                <button className="rounded-2xl bg-emerald px-5 py-3 font-black text-black shadow-glow">{t("create")}</button>
              </div>
            </form>
            <div className="space-y-3">
              {gamemodes.map((mode) => (
                <div key={mode.slug} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-white">{mode.name}</p>
                    <p className="text-sm text-zinc-500">/{mode.slug} - {mode.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => toggleMode(mode)} className={cn("rounded-full px-4 py-2 text-sm font-black", mode.enabled ? "bg-emerald text-black" : "border border-white/10 text-zinc-300")}>{mode.enabled ? t("enabledLabel") : t("disabledLabel")}</button>
                    <button onClick={() => removeMode(mode.slug)} className="rounded-full border border-lava/40 px-4 py-2 text-sm font-black text-lava transition hover:bg-lava/10">{t("delete")}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {active === "cooldowns" && <SimpleList items={cooldowns.length ? cooldowns.map((cooldown) => `${cooldown.username} - ${cooldown.scope}${cooldown.gamemode ? `/${cooldown.gamemode}` : ""} - ${t("expires")} ${new Date(cooldown.expiresAt).toLocaleString()}`) : [t("globalCooldown"), t("gamemodeCooldown"), t("queueJoinChecks")]} />}
        {active === "discord" && <SimpleList items={[`${t("oauthRoute")}: /auth/discord`, `${t("botCommands")}: /help /profile /stats /rank /queue /join /leave /tier /testers /cooldown /gamemodes /verify /admin`, `${t("resultEmbedCommand")}: /submitresult`]} />}
      </motion.section>
    </div>
  );
}

function SimpleList({ items }: { items: string[] }) {
  return (
    <div className="mt-8 space-y-3">
      {items.map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-zinc-300">{item}</div>)}
    </div>
  );
}
