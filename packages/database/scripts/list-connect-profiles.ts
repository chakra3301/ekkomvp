// READ-ONLY inventory of every ConnectProfile (the cards that feed the
// discovery deck). Used to spot orphan / test cards that don't belong to a
// real person. Makes NO writes.
//
// Usage:
//   cd packages/database
//   set -a && . ../../.env.local && set +a
//   pnpm tsx scripts/list-connect-profiles.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.connectProfile.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          accessGranted: true,
          isFounder: true,
          createdAt: true,
          profile: { select: { username: true, displayName: true } },
        },
      },
    },
  });

  console.log(`Total ConnectProfiles: ${profiles.length}\n`);
  console.log(
    [
      "#".padEnd(3),
      "active".padEnd(7),
      "tmpl".padEnd(9),
      "media".padEnd(6),
      "role".padEnd(9),
      "email".padEnd(36),
      "displayName".padEnd(22),
      "created",
    ].join(" ")
  );
  console.log("-".repeat(140));

  profiles.forEach((p, i) => {
    const slots = Array.isArray(p.mediaSlots) ? (p.mediaSlots as unknown[]).length : 0;
    const hasProfile = p.user?.profile != null;
    const flags: string[] = [];
    if (!hasProfile) flags.push("NO-PROFILE");
    if (!p.user) flags.push("NO-USER");
    if (p.user?.isFounder) flags.push("founder");
    if (!p.user?.accessGranted) flags.push("ungated");

    console.log(
      [
        String(i + 1).padEnd(3),
        (p.isActive ? "yes" : "NO").padEnd(7),
        String(p.profileTemplate ?? "default").padEnd(9),
        String(slots).padEnd(6),
        String(p.user?.role ?? "?").padEnd(9),
        String(p.user?.email ?? "(none)").padEnd(36),
        String(p.user?.profile?.displayName ?? "(none)").slice(0, 22).padEnd(22),
        p.createdAt.toISOString().slice(0, 10),
        flags.length ? "  ⚠ " + flags.join(",") : "",
      ].join(" ")
    );
  });

  // Also surface any ConnectProfile whose userId points at a missing User row
  // (true orphans), plus any User flagged ADMIN (so we don't nuke staff).
  const orphans = profiles.filter((p) => !p.user);
  if (orphans.length) {
    console.log(`\n⚠ ${orphans.length} ConnectProfile(s) with NO backing User row:`);
    orphans.forEach((p) => console.log(`   connectProfile.id=${p.id} userId=${p.userId}`));
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
