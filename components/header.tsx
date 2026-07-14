"use client";

import Link from "next/link";
import { ChevronDown, Moon, Settings, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { serverConfig } from "@/config";
import { getStoredRole, getStoredUsername, logout } from "@/lib/auth-client";
import { type Language, usePreferences } from "@/components/preferences";

const nav = [
  { href: "/ranking", label: "Ranking" },
  { href: "/queue", label: "Queue" }
];

const languages: Array<{ code: Language; label: string }> = [
  { code: "de", label: "DE" },
  { code: "it", label: "IT" },
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "es", label: "ES" }
];

export function Header() {
  const { language, setLanguage, theme, setTheme, t } = usePreferences();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const activeLanguage = languages.find((item) => item.code === language) || languages[2];

  useEffect(() => {
    setIsAdmin(getStoredRole() === "ADMIN");
    setUsername(getStoredUsername());
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-obsidian/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <img src={serverConfig.serverLogo} alt={serverConfig.serverName} className="h-10 w-10 rounded-lg object-contain" />
          <div>
            <p className="font-display text-sm font-black uppercase tracking-[0.28em] text-white">{serverConfig.serverName}</p>
            <p className="hidden text-xs text-zinc-500 sm:block">{t("tierNetwork")}</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white">
              {t(item.label.toLowerCase())}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white">
              {t("admin")}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setLanguageOpen((value) => !value)}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-xs font-black text-white transition hover:border-white/20"
              aria-label={t("language")}
            >
              <Flag code={activeLanguage.code} />
              {activeLanguage.label}
              <ChevronDown className={languageOpen ? "h-3.5 w-3.5 rotate-180 transition" : "h-3.5 w-3.5 transition"} />
            </button>
            {languageOpen && (
              <div className="absolute right-0 top-12 z-50 w-36 overflow-hidden rounded-xl border border-white/10 bg-[#111722] p-1 shadow-card">
                {languages.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setLanguage(item.code);
                      setLanguageOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold text-zinc-200 transition hover:bg-white/10"
                  >
                    <Flag code={item.code} />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-zinc-300 transition hover:border-emerald/40 hover:text-white"
            aria-label={t("themeToggle")}
          >
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <span className="hidden h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-zinc-400 sm:grid">
            <Settings className="h-4 w-4" />
          </span>
          {username ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-zinc-200">
                {username}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-zinc-200 transition hover:border-lava/50 hover:text-white"
              >
                {t("logout")}
              </button>
            </div>
          ) : (
            <a href={`${serverConfig.apiUrl}/auth/discord`} className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-zinc-200 transition hover:border-emerald/50 hover:text-white sm:inline-flex">
              {t("login")}
            </a>
          )}
          <a href={serverConfig.discordLink} className="rounded-full bg-emerald px-4 py-2 text-sm font-black text-black shadow-glow transition hover:scale-[1.03]">
            {t("discord")}
          </a>
        </div>
      </div>
    </header>
  );
}

function Flag({ code }: { code: Language }) {
  return (
    <span className="relative h-3.5 w-5 overflow-hidden rounded-[2px] border border-white/10 shadow-sm">
      {code === "de" && (
        <>
          <span className="absolute inset-x-0 top-0 h-1/3 bg-black" />
          <span className="absolute inset-x-0 top-1/3 h-1/3 bg-red-600" />
          <span className="absolute inset-x-0 bottom-0 h-1/3 bg-yellow-400" />
        </>
      )}
      {code === "en" && (
        <>
          <span className="absolute inset-0 bg-blue-800" />
          <span className="absolute left-0 top-[5px] h-1 w-full bg-white" />
          <span className="absolute left-[8px] top-0 h-full w-1 bg-white" />
          <span className="absolute left-0 top-[6px] h-[2px] w-full bg-red-600" />
          <span className="absolute left-[9px] top-0 h-full w-[2px] bg-red-600" />
        </>
      )}
      {code === "it" && (
        <>
          <span className="absolute inset-y-0 left-0 w-1/3 bg-emerald-600" />
          <span className="absolute inset-y-0 left-1/3 w-1/3 bg-white" />
          <span className="absolute inset-y-0 right-0 w-1/3 bg-red-600" />
        </>
      )}
      {code === "fr" && (
        <>
          <span className="absolute inset-y-0 left-0 w-1/3 bg-blue-700" />
          <span className="absolute inset-y-0 left-1/3 w-1/3 bg-white" />
          <span className="absolute inset-y-0 right-0 w-1/3 bg-red-600" />
        </>
      )}
      {code === "es" && (
        <>
          <span className="absolute inset-x-0 top-0 h-1/4 bg-red-600" />
          <span className="absolute inset-x-0 top-1/4 h-1/2 bg-yellow-400" />
          <span className="absolute inset-x-0 bottom-0 h-1/4 bg-red-600" />
        </>
      )}
    </span>
  );
}
