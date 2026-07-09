"use client";

import { Suspense } from "react";
import { LoginCallback } from "@/components/login-callback";
import { usePreferences } from "@/components/preferences";

export function LoginPageContent() {
  const { t } = usePreferences();

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald">{t("discordOauth")}</p>
      <h1 className="mt-4 font-display text-5xl font-black tracking-tight text-white">{t("loginStatus")}</h1>
      <div className="mt-8">
        <Suspense fallback={<div className="rounded-card border border-white/10 bg-card/90 p-8 text-zinc-300 shadow-card">{t("loadingLoginState")}</div>}>
          <LoginCallback />
        </Suspense>
      </div>
    </div>
  );
}
