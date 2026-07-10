export const serverConfig = {
  serverName: "HelloPvP",
  serverLogo: "/logo.svg",
  websiteName: "HelloPvP Tier Testing Platform",
  discordLink: process.env.NEXT_PUBLIC_DISCORD_INVITE || "https://discord.gg/your-server",
  websiteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  serverIp: process.env.NEXT_PUBLIC_SERVER_IP || "",
  colors: {
    background: "#050505",
    card: "#121212",
    primary: "#ef4444",
    accent: "#3b82f6",
    lava: "#ff7a1a",
    text: "#ffffff"
  }
} as const;

export type ServerConfig = typeof serverConfig;
