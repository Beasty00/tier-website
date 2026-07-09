export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(input: string | Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(input));
}

export function tierTone(tier: string) {
  const tones: Record<string, string> = {
    HT1: "border-emerald/40 bg-emerald/12 text-emerald",
    LT1: "border-emerald/25 bg-emerald/8 text-emerald/90",
    HT2: "border-diamond/40 bg-diamond/12 text-diamond",
    LT2: "border-diamond/25 bg-diamond/8 text-diamond/90",
    HT3: "border-gold/40 bg-gold/12 text-gold",
    LT3: "border-gold/25 bg-gold/8 text-gold/90",
    HT4: "border-lava/40 bg-lava/12 text-lava",
    LT4: "border-lava/25 bg-lava/8 text-lava/90",
    HT5: "border-white/20 bg-white/8 text-zinc-300",
    LT5: "border-white/10 bg-white/[0.04] text-zinc-500"
  };

  return tones[tier] || tones.LT5;
}

export function regionTone(region: string) {
  const tones: Record<string, string> = {
    EU: "text-emerald",
    NA: "text-diamond",
    AS: "text-gold",
    AU: "text-lava"
  };

  return tones[region] || "text-zinc-300";
}
