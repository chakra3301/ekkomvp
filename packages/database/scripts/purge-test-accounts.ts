// Purge the leftover internal TEST accounts that were polluting the Connect
// discovery deck. Deletes the whole User row for each — every User relation in
// the schema is onDelete: Cascade or SetNull, so Profile, ConnectProfile,
// swipes (both directions), matches, messages, follows, etc. all cascade away.
//
// 10starreview@ekko.com is intentionally NOT in this list — it's the live
// App Store review sign-in profile and must stay.
//
// Usage:
//   cd packages/database
//   set -a && . ../../.env.local && set +a
//   pnpm tsx scripts/purge-test-accounts.ts          # dry run (prints, no writes)
//   pnpm tsx scripts/purge-test-accounts.ts --apply  # actually delete

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Exact allowlist — only these emails will ever be touched.
const TARGET_EMAILS = [
  "test@ekkoconnect.app",
  "testme@ekkoconnect.app",
  "tester@ekkoconnect.app",
];

async function main() {
  const apply = process.argv.includes("--apply");

  const users = await prisma.user.findMany({
    where: { email: { in: TARGET_EMAILS } },
    select: {
      id: true,
      email: true,
      role: true,
      isFounder: true,
      profile: { select: { id: true, displayName: true } },
      connectProfile: { select: { id: true } },
      _count: {
        select: {
          connectSwipesSent: true,
          connectSwipesReceived: true,
          connectMatchesAsUser1: true,
          connectMatchesAsUser2: true,
          posts: true,
        },
      },
    },
  });

  console.log(`${apply ? "APPLYING" : "DRY RUN"} — matched ${users.length}/${TARGET_EMAILS.length} target emails\n`);

  if (users.some((u) => u.role === "ADMIN" || u.isFounder)) {
    console.error("✋ Refusing — a target resolved to an ADMIN/founder account. Aborting.");
    process.exit(1);
  }

  for (const u of users) {
    console.log(`• ${u.email}`);
    console.log(`    userId:         ${u.id}`);
    console.log(`    displayName:    ${u.profile?.displayName ?? "(no Profile row)"}`);
    console.log(`    connectProfile: ${u.connectProfile?.id ?? "(none)"}`);
    console.log(
      `    cascades:       swipesSent=${u._count.connectSwipesSent} swipesReceived=${u._count.connectSwipesReceived} ` +
        `matches=${u._count.connectMatchesAsUser1 + u._count.connectMatchesAsUser2} posts=${u._count.posts}`
    );
  }

  const missing = TARGET_EMAILS.filter((e) => !users.some((u) => u.email === e));
  if (missing.length) console.log(`\n(note: not found — already gone? ${missing.join(", ")})`);

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to delete.");
    return;
  }

  const ids = users.map((u) => u.id);
  const result = await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`\n✔ Deleted ${result.count} User row(s) (cascade wiped their Profile/ConnectProfile/swipes/matches).`);
  console.log("Note: Supabase auth.users entries are separate and untouched — harmless for unused test logins.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
