import type { Metadata } from "next";
import { PlayerProfileLive } from "@/components/player-profile-live";
import { seedPlayers } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return seedPlayers.map((player) => ({ id: player.username }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const player = seedPlayers.find((item) => item.username.toLowerCase() === decodeURIComponent(id).toLowerCase() || item.id === id || item.uuid === id);
  return {
    title: player ? `${player.username} Profile` : "Player Profile",
    description: player ? `${player.username} Minecraft tier profile, history, points and gamemode tiers.` : "Minecraft player tier profile."
  };
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const player = seedPlayers.find((item) => item.username.toLowerCase() === decoded.toLowerCase() || item.id === decoded || item.uuid === decoded);

  return (
    <main className="minecraft-grid min-h-screen px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <PlayerProfileLive id={decoded} fallback={player || null} />
      </div>
    </main>
  );
}
