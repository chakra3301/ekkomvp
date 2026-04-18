/**
 * Resets (or sets) a user's Connect tier. Useful for re-testing the
 * purchase flow against an account that's already INFINITE.
 *
 * Usage (from repo root):
 *   set -a; source .env.local; set +a
 *   cd packages/database
 *   npx tsx scripts/set-tier.ts <email> <FREE|INFINITE>
 *
 * Example:
 *   npx tsx scripts/set-tier.ts jojoleoleo@gmail.com FREE
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const tier = process.argv[3] as "FREE" | "INFINITE" | undefined;

  if (!email || !tier || !["FREE", "INFINITE"].includes(tier)) {
    console.error("Usage: tsx scripts/set-tier.ts <email> <FREE|INFINITE>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  const existing = await prisma.connectProfile.findUnique({
    where: { userId: user.id },
  });
  if (!existing) {
    console.error(`${email} has no ConnectProfile yet.`);
    process.exit(1);
  }

  const updated = await prisma.connectProfile.update({
    where: { userId: user.id },
    data: { connectTier: tier },
  });

  console.log(`✔ ${email} connectTier: ${existing.connectTier} → ${updated.connectTier}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
