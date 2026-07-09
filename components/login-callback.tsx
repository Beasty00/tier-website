"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePreferences } from "@/components/preferences";

export function LoginCallback() {
  const params = useSearchParams();
  const { t } = usePreferences();
  const [statusKey, setStatusKey] = useState("checkingDiscordLoginToken");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatusKey("noLoginToken");
      return;
    }
    localStorage.setItem("tier_testing_token", token);
    setStatusKey("savedLoginToken");
  }, [params]);

  return <div className="rounded-card border border-white/10 bg-card/90 p-8 text-zinc-300 shadow-card">{t(statusKey)}</div>;
}
