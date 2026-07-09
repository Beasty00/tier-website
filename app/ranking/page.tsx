import type { Metadata } from "next";
import { RankingIntro } from "@/components/ranking-intro";
import { RankingTable } from "@/components/ranking-table";
import { seedPlayers } from "@/lib/seed";

export const metadata: Metadata = {
  title: "Ranking",
  description: "Minecraft tier ranking with live search, region filters, gamemode filters and tier filters."
};

export default function RankingPage() {
  return (
    <main className="minecraft-grid min-h-screen px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <RankingIntro />
        <RankingTable players={seedPlayers} />
      </div>
    </main>
  );
}
