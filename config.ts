export const serverConfig = {
  serverName: "HelloPvP",
  serverLogo: "/logo.png",
  websiteName: "HelloPvP Tier Testing Platform",
  discordLink: process.env.NEXT_PUBLIC_DISCORD_INVITE || "https://discord.gg/hellopvp",
  websiteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  serverIp: process.env.NEXT_PUBLIC_SERVER_IP || "",
  colors: {
    background: "#050505",
    card: "#121212",
    primary: "#2f7dfa",
    accent: "#f5f5f5",
    lava: "#ef4444",
    text: "#ffffff"
  }
} as const;

export type ServerConfig = typeof serverConfig;
