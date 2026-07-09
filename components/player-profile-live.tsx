"use client";

import { useEffect, useState } from "react";
import { serverConfig } from "@/config";
import type { Player } from "@/lib/types";
import { PlayerProfile } from "@/components/player-profile";
import { usePreferences } from "@/components/preferences";

export function PlayerProfileLive({ id, fallback }: { id: string; fallback?: Player | null }) {
  const { t } = usePreferences();
  const [player, setPlayer] = useState<Player | null>(fallback || null);
  const [loading, setLoading] = useState(!fallback);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPlayer() {
      try {
        const response = await fetch(`${serverConfig.apiUrl}/player/${encodeURIComponent(id)}`, { cache: "no-store" });
        if (!active) return;
        if (response.ok) {
          setPlayer(await response.json() as Player);
          setMissing(false);
          return;
        }
        if (!fallback) setMissing(true);
      } catch {
        if (!fallback) setMissing(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPlayer();
    const timer = window.setInterval(loadPlayer, 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [fallback, id]);

  if (player) return <PlayerProfile player={player} />;

  return (
    <div className="rounded-card border border-white/10 bg-card/90 p-8 text-center shadow-card">
      <p className="text-sm font-black uppercase tracking-[0.24em] text-zinc-500">{loading ? t("loadingProfile") : t("playerProfile")}</p>
      <h1 className="mt-4 font-display text-5xl font-black tracking-tight text-white">{decodeURIComponent(id)}</h1>
      <p className="mx-auto mt-4 max-w-xl text-zinc-400">
        {missing ? t("playerMissing") : t("fetchingPlayer")}
      </p>
    </div>
  );
}
