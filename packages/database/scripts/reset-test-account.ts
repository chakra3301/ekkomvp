// One-off reset for a single test account so it walks the new sign-up flow
// from scratch on next app launch. Deletes the user's Profile and
// ConnectProfile rows (and everything that cascade-deletes from them) but
// leaves the User row + Supabase auth session intact.
//
// Usage:
//   cd packages/database
//   set -a && . ../../.env.local && set +a
//   pnpm tsx scripts/reset-test-account.ts <email>

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: pnpm tsx scripts/reset-test-account.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: { select: { id: true, displayName: true } },
      connectProfile: { select: { id: true, profileTemplate: true } },
    },
  });

  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  console.log(`User: ${user.id}`);
  console.log(`  email:          ${user.email}`);
  console.log(`  accessGranted:  ${user.accessGranted}`);
  console.log(`  isFounder:      ${user.isFounder}`);
  console.log(`  Profile:        ${user.profile ? user.profile.id + " (" + (user.profile.displayName ?? "") + ")" : "none"}`);
  console.log(`  ConnectProfile: ${user.connectProfile ? user.connectProfile.id + " (" + (user.connectProfile.profileTemplate ?? "default") + ")" : "none"}`);

  if (!user.profile && !user.connectProfile) {
    console.log("Nothing to reset — user has no Profile or ConnectProfile rows.");
    return;
  }

  console.log("");
  console.log("Deleting Profile + ConnectProfile (cascades wipe posts, comments, follows, swipes, matches, messages, etc.)…");

  const result = await prisma.$transaction(async (tx) => {
    let profileDeleted: { id: string } | null = null;
    let connectDeleted: { id: string } | null = null;
    if (user.connectProfile) {
      connectDeleted = await tx.connectProfile.delete({
        where: { userId: user.id },
        select: { id: true },
      });
    }
    if (user.profile) {
      profileDeleted = await tx.profile.delete({
        where: { userId: user.id },
        select: { id: true },
      });
    }
    return { profileDeleted, connectDeleted };
  });

  console.log(`  ✔ ConnectProfile deleted: ${result.connectDeleted?.id ?? "(none)"}`);
  console.log(`  ✔ Profile deleted:        ${result.profileDeleted?.id ?? "(none)"}`);
  console.log("");
  console.log("Done. On next app launch this account will land on CompleteProfileView,");
  console.log("then walk the new ThemePicker → AvatarPicker → ProfileSetupView flow.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
