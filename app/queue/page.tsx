import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { QueuePanel } from "@/components/queue-panel";

export const metadata: Metadata = {
  title: "Queue",
  description: "Join or leave the Minecraft tier testing queue with waitlist and cooldown support."
};

export default function QueuePage() {
  return (
    <main className="minecraft-grid min-h-screen px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <PageHero eyebrowKey="queueSystem" titleKey="queueTitle" textKey="queueText" />
        <QueuePanel />
      </div>
    </main>
  );
}
