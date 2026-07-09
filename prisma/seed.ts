import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedGamemodes, seedPlayers, seedRegions, seedTesters, seedTests, seedTiers } from "../lib/seed";

const prisma = new PrismaClient();

async function main() {
  for (const region of seedRegions) {
    await prisma.region.upsert({
      where: { code: region.code },
      update: { name: region.name, enabled: region.enabled },
      create: { id: region.id, code: region.code, name: region.name, enabled: region.enabled }
    });
  }

  for (const tier of seedTiers) {
    await prisma.tier.upsert({
      where: { code: tier.code },
      update: { label: tier.label, order: tier.order, pointsMin: tier.pointsMin },
      create: { id: tier.id, code: tier.code, label: tier.label, order: tier.order, pointsMin: tier.pointsMin }
    });
  }

  for (const gamemode of seedGamemodes) {
    await prisma.gamemode.upsert({
      where: { slug: gamemode.slug },
      update: { name: gamemode.name, description: gamemode.description, icon: gamemode.icon, enabled: gamemode.enabled },
      create: {
        id: gamemode.id,
        slug: gamemode.slug,
        name: gamemode.name,
        description: gamemode.description,
        icon: gamemode.icon,
        enabled: gamemode.enabled
      }
    });
  }

  for (const tester of seedTesters) {
    const region = await prisma.region.findUniqueOrThrow({ where: { code: tester.region } });
    const createdTester = await prisma.tester.upsert({
      where: { id: tester.id },
      update: { name: tester.name, discordId: tester.discordId, regionId: region.id, active: tester.active },
      create: { id: tester.id, name: tester.name, discordId: tester.discordId, regionId: region.id, active: tester.active }
    });

    await prisma.testerGamemode.deleteMany({ where: { testerId: createdTester.id } });
    for (const slug of tester.gamemodes) {
      const gamemode = await prisma.gamemode.findUnique({ where: { slug } });
      if (!gamemode) continue;
      await prisma.testerGamemode.create({ data: { testerId: createdTester.id, gamemodeId: gamemode.id } });
    }
  }

  for (const player of seedPlayers) {
    const region = await prisma.region.findUniqueOrThrow({ where: { code: player.region } });
    const tier = await prisma.tier.findUniqueOrThrow({ where: { code: player.tier } });
    const tester = await prisma.tester.findFirst({ where: { name: player.tester } });

    const createdPlayer = await prisma.player.upsert({
      where: { username: player.username },
      update: {
        uuid: player.uuid,
        skin: player.skin,
        regionId: region.id,
        points: player.points,
        rank: player.rank,
        tierId: tier.id,
        testerId: tester?.id,
        lastTestAt: new Date(player.lastTestAt)
      },
      create: {
        id: player.id,
        uuid: player.uuid,
        username: player.username,
        skin: player.skin,
        regionId: region.id,
        points: player.points,
        rank: player.rank,
        tierId: tier.id,
        testerId: tester?.id,
        createdAt: new Date(player.createdAt),
        lastTestAt: new Date(player.lastTestAt)
      }
    });

    for (const [slug, tierCode] of Object.entries(player.gamemodeTiers)) {
      const gamemode = await prisma.gamemode.findUnique({ where: { slug } });
      const modeTier = await prisma.tier.findUnique({ where: { code: tierCode } });
      if (!gamemode || !modeTier) continue;

      await prisma.playerTier.upsert({
        where: { playerId_gamemodeId: { playerId: createdPlayer.id, gamemodeId: gamemode.id } },
        update: { tierId: modeTier.id, testerId: tester?.id, points: player.points },
        create: { playerId: createdPlayer.id, gamemodeId: gamemode.id, tierId: modeTier.id, testerId: tester?.id, points: player.points }
      });
    }
  }

  await prisma.test.deleteMany({});
  for (const test of seedTests) {
    const player = await prisma.player.findUnique({ where: { username: test.username } });
    const region = await prisma.region.findUnique({ where: { code: test.region } });
    const gamemode = await prisma.gamemode.findUnique({ where: { slug: test.gamemode } });
    const tester = await prisma.tester.findFirst({ where: { name: test.tester } });
    const tier = await prisma.tier.findUnique({ where: { code: test.tier } });
    if (!player || !region || !gamemode || !tier) continue;

    await prisma.test.create({
      data: {
        id: test.id,
        playerId: player.id,
        regionId: region.id,
        gamemodeId: gamemode.id,
        testerId: tester?.id,
        tierId: tier.id,
        notes: test.notes,
        createdAt: new Date(test.createdAt)
      }
    });
  }

  await prisma.setting.upsert({
    where: { key: "branding" },
    update: {
      value: {
        serverName: "Nerotier",
        serverIp: "",
        discordLink: process.env.NEXT_PUBLIC_DISCORD_INVITE || "https://discord.gg/your-server"
      }
    },
    create: {
      key: "branding",
      value: {
        serverName: "Nerotier",
        serverIp: "",
        discordLink: process.env.NEXT_PUBLIC_DISCORD_INVITE || "https://discord.gg/your-server"
      }
    }
  });

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
