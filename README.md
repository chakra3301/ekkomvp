# EKKO

**The LinkedIn for Creatives** - A professional platform connecting creatives with hiring opportunities.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** tRPC, Prisma
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A Supabase project

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/your-org/ekko.git
cd ekko
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials.

4. **Set up the database**

```bash
pnpm db:generate
pnpm db:push
```

5. **Seed the database** (optional)

```bash
pnpm --filter @ekko/database db:seed
```

6. **Start the development server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ekko/
├── apps/
│   └── web/                 # Next.js application
├── packages/
│   ├── api/                 # tRPC routers
│   ├── config/              # Shared configuration
│   └── database/            # Prisma schema and client
├── tooling/
│   └── tailwind-config/     # Shared Tailwind config
└── turbo.json               # Turborepo configuration
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Prisma Studio |

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings → API
3. Create storage buckets:
   - `avatars` (public, 2MB max)
   - `portfolio` (public, 10MB max)
   - `posts` (public, 10MB max)
4. Configure Google OAuth in Authentication → Providers (optional)

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Set the root directory to `apps/web`
3. Add environment variables in the Vercel dashboard
4. Deploy!

## License

Private - All rights reserved.
