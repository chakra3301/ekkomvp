# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

EKKO is a "LinkedIn for Creatives" — a pnpm monorepo (Turborepo) with a Next.js 14 web app, tRPC API layer, and Prisma ORM backed by Supabase (PostgreSQL, Auth, Storage). See `package.json` scripts and `turbo.json` for standard commands.

### Required environment variables

The following secrets must be injected as environment variables (via Cursor Secrets):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (Supabase PostgreSQL connection string with pgbouncer)
- `DIRECT_URL` (Supabase PostgreSQL direct connection string, used for Prisma migrations)

Before running the dev server, create `/workspace/.env` and `/workspace/apps/web/.env.local` containing these variables plus `NEXT_PUBLIC_APP_URL=http://localhost:3000` and `NEXT_PUBLIC_APP_NAME=EKKO`.

### Running the dev server

```bash
pnpm db:generate   # Generate Prisma client (required before first dev run)
pnpm dev           # Starts Next.js dev server on http://localhost:3000
```

### Non-obvious caveats

- **Prisma client must be generated before dev/build**: Run `pnpm db:generate` after `pnpm install`. The update script handles this automatically.
- **Pre-existing typecheck failures in library packages**: `pnpm typecheck` fails for `@ekko/database` and `@ekko/api` due to a `rootDir` misconfiguration in `packages/typescript-config/library.json`. The web app (`pnpm --filter @ekko/web typecheck`) typechecks cleanly. This is a known issue in the repo.
- **Lint produces warnings only**: `pnpm lint` succeeds (exit 0) but emits `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unused-vars` warnings. These are pre-existing.
- **No test suite exists**: There are no automated test files or test framework configured in this repository.
- **No Docker/Makefile setup**: This is a pure Vercel/Supabase deployment model with no Docker Compose or Makefile.
