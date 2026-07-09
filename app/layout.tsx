import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PreferencesProvider } from "@/components/preferences";
import { serverConfig } from "@/config";

export const metadata: Metadata = {
  title: {
    default: serverConfig.websiteName,
    template: `%s | ${serverConfig.serverName}`
  },
  description: "The complete ranking, testing and queue management solution for Minecraft servers.",
  keywords: ["Minecraft", "Tier Testing", "Discord Bot", "Ranking", "Queue", "PvP"],
  openGraph: {
    title: serverConfig.websiteName,
    description: "Minecraft tier testing, rankings, queues, waitlists and tester management.",
    type: "website",
    url: serverConfig.websiteUrl
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="noise">
        <PreferencesProvider>
          <Header />
          {children}
          <Footer />
        </PreferencesProvider>
      </body>
    </html>
  );
}
