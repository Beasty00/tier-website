"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { serverConfig } from "@/config";
import { usePreferences } from "@/components/preferences";
import { GAMEMODES, REGIONS, type Gamemode, type QueueEntry, type RegionCode, type Tester, type WaitlistEntry } from "@/lib/types";
import { seedQueue, seedWaitlist } from "@/lib/seed";
import { cn, regionTone } from "@/lib/utils";

type JoinStatus = { kind: "idle" | "queued" | "waitlisted" | "exists" | "cooldown" | "error"; key: string; values?: Record<string, string | number> };

export function QueuePanel() {
  const { t, tf } = usePreferences();
  const [username, setUsername] = useState("");
  const [region, setRegion] = useState<RegionCode>("EU");
  const [gamemode, setGamemode] = useState("vanilla");
  const [gamemodes, setGamemodes] = useState<Gamemode[]>(GAMEMODES);
  const [testers, setTesters] = useState<Tester[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>(seedQueue);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(seedWaitlist);
  const [priority, setPriority] = useState(false);
  const [status, setStatus] = useState<JoinStatus>({ kind: "idle", key: "queueInitialStatus" });

  const activeTesters = useMemo(() => {
    const matching = testers.filter((tester) => tester.active && tester.gamemodes.includes(gamemode)).length;
    return Math.max(1, matching || (gamemode === "overall" ? 3 : 1));
  }, [gamemode, testers]);

  async function refreshLiveData() {
    try {
      const [queueResponse, gamemodesResponse, testersResponse] = await Promise.all([
        fetch(`${serverConfig.apiUrl}/queue`, { cache: "no-store" }),
        fetch(`${serverConfig.apiUrl}/gamemodes`, { cache: "no-store" }),
        fetch(`${serverConfig.apiUrl}/testers`, { cache: "no-store" })
      ]);

      if (queueResponse.ok) {
        const data = await queueResponse.json() as { queue?: QueueEntry[]; waitlist?: WaitlistEntry[] };
        if (Array.isArray(data.queue)) setQueue(data.queue);
        if (Array.isArray(data.waitlist)) setWaitlist(data.waitlist);
      }

      if (gamemodesResponse.ok) {
        const data = await gamemodesResponse.json() as Gamemode[];
        if (Array.isArray(data) && data.length > 0) setGamemodes(data.filter((mode) => mode.enabled));
      }

      if (testersResponse.ok) {
        const data = await testersResponse.json() as Tester[];
        if (Array.isArray(data)) setTesters(data);
      }
    } catch {
      // Seed data keeps the queue usable when the API is not running.
    }
  }

  useEffect(() => {
    refreshLiveData();
    const timer = window.setInterval(refreshLiveData, 20_000);
    return () => window.clearInterval(timer);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    const payload = { username: trimmed, region, gamemode, priority: priority ? 1 : 0 };

    try {
      const response = await fetch(`${serverConfig.apiUrl}/queue/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok && data.status !== "cooldown") throw new Error(data.error || t("queueRequestFailed"));
      setStatus(data.status === "cooldown"
        ? { kind: "cooldown", key: "cooldownUntil", values: { time: new Date(data.cooldown.expiresAt).toLocaleString() } }
        : { kind: data.status, key: "statusLabel", values: { status: data.status } });
      if (data.status === "queued" && data.entry) setQueue((items) => [...items.filter((item) => item.username !== trimmed), data.entry]);
      if (data.status === "waitlisted" && data.entry) setWaitlist((items) => [...items.filter((item) => item.username !== trimmed), data.entry]);
      await refreshLiveData();
      return;
    } catch {
      const position = queue.length + 1;
      const entry: QueueEntry = {
        id: `local-${Date.now()}`,
        username: trimmed,
        region,
        gamemode,
        priority: priority ? 1 : 0,
        position,
        status: "WAITING",
        joinedAt: new Date().toISOString(),
        estimatedMinutes: Math.ceil((position * 12) / activeTesters)
      };
      setQueue((items) => [...items, entry].sort((left, right) => right.priority - left.priority).map((item, index) => ({ ...item, position: index + 1 })));
      setStatus({ kind: "queued", key: "queueAddedLocal" });
    }
  }

  async function leave() {
    const trimmed = username.trim();
    if (!trimmed) return;
    setQueue((items) => items.filter((item) => item.username.toLowerCase() !== trimmed.toLowerCase()));
    setWaitlist((items) => items.filter((item) => item.username.toLowerCase() !== trimmed.toLowerCase()));
    setStatus({ kind: "idle", key: "leftLocalQueue", values: { username: trimmed } });

    try {
      await fetch(`${serverConfig.apiUrl}/queue/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed, gamemode })
      });
      await refreshLiveData();
    } catch {
      // Local fallback already updated the UI.
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={submit} className="rounded-card border border-white/10 bg-card/90 p-6 shadow-card">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald">{t("joinQueue")}</p>
        <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-white">{t("requestTierTest")}</h2>
        <p className="mt-3 text-sm text-zinc-400">{t("queueJoinText")}</p>
        <div className="mt-6 grid gap-4">
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder={t("minecraftUsername")} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-emerald/60" />
          <div className="grid gap-4 sm:grid-cols-2">
            <select value={region} onChange={(event) => setRegion(event.target.value as RegionCode)} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60">
              {REGIONS.map((item) => <option key={item.code} value={item.code}>{item.code} - {item.name}</option>)}
            </select>
            <select value={gamemode} onChange={(event) => setGamemode(event.target.value)} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-emerald/60">
              {gamemodes.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
            </select>
          </div>
          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-300">
            {t("priorityQueue")}
            <input type="checkbox" checked={priority} onChange={(event) => setPriority(event.target.checked)} className="h-5 w-5 accent-emerald" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="submit" className="rounded-2xl bg-emerald px-5 py-3 font-black text-black shadow-glow transition hover:scale-[1.02]">{t("joinQueue")}</button>
            <button type="button" onClick={leave} className="rounded-2xl border border-white/10 px-5 py-3 font-black text-zinc-200 transition hover:border-lava/60 hover:text-white">{t("leaveQueue")}</button>
          </div>
        </div>
        <div className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm", status.kind === "error" || status.kind === "cooldown" ? "border-lava/40 bg-lava/10 text-lava" : "border-emerald/30 bg-emerald/10 text-emerald")}>{tf(status.key, status.values || {})}</div>
      </form>

      <div className="rounded-card border border-white/10 bg-card/90 p-6 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-zinc-500">{t("liveQueue")}</p>
            <h2 className="mt-3 font-display text-3xl font-black text-white">{t("positionsAndEta")}</h2>
          </div>
          <span className="rounded-full border border-emerald/30 bg-emerald/10 px-4 py-2 text-sm font-bold text-emerald">{t("activeTesters")}: {activeTesters}</span>
        </div>
        <div className="mt-6 space-y-3">
          {queue.map((entry) => (
            <div key={entry.id} className="grid gap-3 rounded-2xl border border-white/10 bg-black/35 p-4 sm:grid-cols-[0.3fr_1fr_0.5fr_0.7fr] sm:items-center">
              <span className="font-display text-2xl font-black text-white">#{entry.position}</span>
              <div>
                <p className="font-bold text-white">{entry.username}</p>
                <p className="text-xs text-zinc-500">{tf("gamemodeQueue", { mode: entry.gamemode })}</p>
              </div>
              <span className={cn("font-bold", regionTone(entry.region))}>{entry.region}</span>
              <span className="text-sm text-zinc-300">~{entry.estimatedMinutes} min</span>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">{t("waitlist")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {waitlist.length ? waitlist.map((entry) => <span key={entry.id} className="rounded-full border border-white/10 px-3 py-1 text-sm text-zinc-300">#{entry.position} {entry.username}</span>) : <span className="text-sm text-zinc-500">{t("noWaitlistedPlayers")}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
