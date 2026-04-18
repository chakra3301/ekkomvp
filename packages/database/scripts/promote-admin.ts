/**
 * Promotes a user to ADMIN role and grants INFINITE Connect tier.
 *
 * Usage (from repo root):
 *   export $(grep -v '^#' .env.local | xargs)
 *   cd packages/database
 *   pnpm tsx scripts/promote-admin.ts luca47hall@gmail.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: tsx scripts/promote-admin.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  });

  // Ensure they have an INFINITE tier on their Connect profile.
  const connectProfile = await prisma.connectProfile.findUnique({
    where: { userId: user.id },
  });

  if (connectProfile) {
    await prisma.connectProfile.update({
      where: { userId: user.id },
      data: { connectTier: "INFINITE" },
    });
    console.log(`✔ ${email} promoted to ADMIN + INFINITE`);
  } else {
    console.log(
      `✔ ${email} promoted to ADMIN (no ConnectProfile yet — tier will be INFINITE once created, set it manually then)`
    );
  }

  console.log(updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
