import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin-panel";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Manage players, tiers, queue, waitlist, testers, regions, gamemodes, cooldowns and Discord settings."
};

export default function AdminPage() {
  return (
    <main className="minecraft-grid min-h-screen px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <PageHero eyebrowKey="operations" titleKey="adminTitle" textKey="adminText" />
        <AdminPanel />
      </div>
    </main>
  );
}
