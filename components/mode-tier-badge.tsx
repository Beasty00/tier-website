"use client";

import { MinecraftItemIcon } from "@/components/minecraft-item-icon";
import { usePreferences } from "@/components/preferences";
import { type Gamemode } from "@/lib/types";
import { cn } from "@/lib/utils";

const labelTones: Record<string, string> = {
  HT1: "border-[#4a3815] bg-[#261f16] text-[#ffd14a]",
  LT1: "border-[#403716] bg-[#202117] text-[#f5cf42]",
  HT2: "border-[#16435a] bg-[#111e2a] text-[#68dcff]",
  LT2: "border-[#263345] bg-[#121b28] text-[#9aa9bd]",
  HT3: "border-[#5a3519] bg-[#291b12] text-[#ff9845]",
  LT3: "border-[#4b331b] bg-[#251d14] text-[#d79a57]",
  HT4: "border-[#66311c] bg-[#2b1812] text-[#ff7a1a]",
  LT4: "border-[#4d2d20] bg-[#241914] text-[#c98657]",
  HT5: "border-[#3c4453] bg-[#171f2c] text-[#cfd7e3]",
  LT5: "border-[#283241] bg-[#111925] text-[#7d8da3]"
};

type ModeTierBadgeProps = {
  active?: boolean;
  mode: Gamemode;
  tier?: string;
};

export function ModeTierBadge({ active = false, mode, tier }: ModeTierBadgeProps) {
  const { t } = usePreferences();
  const tested = Boolean(tier);
  const title = `${mode.name}: ${tested ? tier : t("free")}`;

  return (
    <span
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex w-9 shrink-0 flex-col items-center gap-[3px] rounded-xl py-[1px]",
        active && "ring-1 ring-emerald/60"
      )}
    >
      {tested ? (
        <MinecraftItemIcon
          slug={mode.slug}
          size="md"
          className="h-8 w-8 rounded-full border-[#2b3445] bg-[#101722] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_3px_10px_rgba(0,0,0,0.34)]"
        />
      ) : (
        <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-dashed border-[#334155] bg-[#0f1622] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" />
      )}
      <span
        className={cn(
          "grid h-[17px] min-w-[28px] place-items-center rounded-[6px] border px-[5px] text-[11px] font-black uppercase leading-none tracking-[0.01em]",
          tested ? labelTones[tier as string] || labelTones.LT5 : "border-[#202a39] bg-[#111925] text-[#748195]"
        )}
      >
        {tested ? tier : "-"}
      </span>
    </span>
  );
}
