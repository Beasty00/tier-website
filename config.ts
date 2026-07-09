export const serverConfig = {
  serverName: "Nerotier",
  serverLogo: "/logo.svg",
  websiteName: "Minecraft Tier Testing Platform",
  discordLink: process.env.NEXT_PUBLIC_DISCORD_INVITE || "https://discord.gg/your-server",
  websiteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  serverIp: process.env.NEXT_PUBLIC_SERVER_IP || "",
  colors: {
    background: "#050505",
    card: "#121212",
    primary: "#31d158",
    accent: "#67e8f9",
    lava: "#ff7a1a",
    text: "#ffffff"
  }
} as const;

export type ServerConfig = typeof serverConfig;
