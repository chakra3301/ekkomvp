// Hand-grant the CEO chrome badge (hasCeoBadge) to a single user.
// There's no UI flow to award it; you run this script.
//
// Usage:
//   cd packages/database
//   set -a && . ../../.env.local && set +a
//   pnpm tsx scripts/grant-ceo-badge.ts <email>            # grant
//   pnpm tsx scripts/grant-ceo-badge.ts <email> --revoke   # revoke

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const revoke = process.argv.includes("--revoke");
  if (!email) {
    console.error("Usage: pnpm tsx scripts/grant-ceo-badge.ts <email> [--revoke]");
    process.exit(1);
  }

  const before = await prisma.user.findUnique({
    where: { email },
    select: { id: true, hasCeoBadge: true },
  });
  if (!before) {
    console.error(`No user with email ${email}`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { hasCeoBadge: !revoke },
    select: { id: true, hasCeoBadge: true },
  });

  console.log(`User ${updated.id}`);
  console.log(`  hasCeoBadge: ${before.hasCeoBadge} → ${updated.hasCeoBadge}`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
