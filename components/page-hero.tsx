"use client";

import { Reveal } from "@/components/animated";
import { usePreferences } from "@/components/preferences";

type PageHeroProps = {
  eyebrowKey: string;
  textKey: string;
  titleKey: string;
};

export function PageHero({ eyebrowKey, textKey, titleKey }: PageHeroProps) {
  const { t } = usePreferences();

  return (
    <Reveal className="mb-8 max-w-3xl">
      <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald">{t(eyebrowKey)}</p>
      <h1 className="mt-4 font-display text-5xl font-black tracking-tight text-white sm:text-7xl">{t(titleKey)}</h1>
      <p className="mt-5 text-lg text-zinc-400">{t(textKey)}</p>
    </Reveal>
  );
}
