"use client";

import type { ReactNode } from "react";
import { usePreferences } from "@/components/preferences";

export function StatCard({ label, value, detail, icon }: { label: string; value: string | number; detail: string; icon: ReactNode }) {
  const { t } = usePreferences();

  return (
    <div className="card-hover rounded-card border border-white/10 bg-card/90 p-5 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald/30 bg-emerald/10 text-emerald">
          {icon}
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">{t("live")}</span>
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <p className="mt-2 font-display text-4xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-3 text-sm text-zinc-400">{detail}</p>
    </div>
  );
}
