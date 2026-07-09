"use client";

import { serverConfig } from "@/config";
import { usePreferences } from "@/components/preferences";

export function Footer() {
  const { t, tf } = usePreferences();

  return (
    <footer className="border-t border-white/10 bg-black/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-zinc-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>{tf("footerFor", { website: serverConfig.websiteName, server: serverConfig.serverName })}</p>
        <div className="flex flex-wrap gap-4">
          <span>{t("api")}: {serverConfig.apiUrl}</span>
          <span>{t("serverIp")}: {serverConfig.serverIp || t("optional")}</span>
          <a className="text-zinc-300 hover:text-white" href={serverConfig.discordLink}>Discord</a>
        </div>
      </div>
    </footer>
  );
}
