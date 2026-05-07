# EKKO — Progress Log

This file is the source of truth for in-flight work. **Update it as you go** so context survives a chat closing.

How to use: when you finish or change a thing, edit this file in the same response. Don't let it drift behind reality.

---

## Active build: Invite-Only Access System

EKKO is gating account creation behind invites + a public application form. Goal: maximum taste density before public launch.

### Decisions locked

| Knob | Value | Rationale |
|------|-------|-----------|
| Invites per member | **3** | Enough to seed taste circles, scarce enough to feel intentional |
| Refresh cadence | **Monthly, activity-gated** | Top up to 3 for members who posted/liked/matched in last 30d. Dormant accounts skipped |
| Founders' circle size | **~75** | Hand-picked across disciplines + 5–8 cities for proximity density |
| Founders' invite count | **5 each** (not 3) | Seed wave needs more reach |
| Public application | **Closed for first 90 days** | Invite-only, then `ekko.app/apply` opens |
| Code format | **8-char alphanumeric**, alphabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no 0/O/1/I/L), 30-day expiry, single-use | OCR-safe, unguessable |
| Founder TTL | **90 days** | Slower seeding turnaround |

### Phase progress

#### Phase 1 — Schema & auth gating

**Backend: DONE (uncommitted, unpushed to DB)**

- [x] `packages/database/prisma/schema.prisma` — User extended with `accessGranted`, `isFounder`, `cohort`, `invitedByUserId` + relations
- [x] Schema models: `Invite`, `SignupApplication`, `MemberInvite`, `MemberReferral`
- [x] Schema enums: `InviteStatus` (ACTIVE/REDEEMED/EXPIRED/REVOKED), `SignupApplicationStatus` (PENDING/APPROVED/WAITLISTED/DECLINED)
- [x] `packages/api/src/trpc.ts` — added `pregatedProcedure`; `protectedProcedure` now requires `accessGranted=true` via `requireAccess` middleware
- [x] `packages/api/src/routers/auth.ts` — `me` and `completeUserInfo` switched to `pregatedProcedure` so onboarding works pre-gate
- [x] `packages/api/src/routers/invite.ts` — `validate`, `redeem`, `myBalance`, `listMine`, `generate`, `revoke`, `adminMint`, `adminList`
- [x] `packages/api/src/routers/signup-application.ts` — `submit`, `myStatus`, `listAdmin`, `review`, `adminStats`
- [x] `packages/api/src/root.ts` — both routers registered

**Pending Phase 1:**

- [x] Schema pushed via `prisma db push` (2026-05-07)
- [x] Prisma Client regenerated (auto-ran with `db push`)
- [x] Backfilled `access_granted = true` for all existing users (2026-05-07) — they remain unaffected by the gate
- [x] iOS gating UX (2026-05-07): `accessGranted`/`isFounder`/`cohort`/`invitedByUserId` added to `User.swift`; `AppState.needsInviteGate` + `pendingInviteCode`; `AppRouter` inserts `InviteGateView` between auth and profile setup; deep links `ekkoconnect://invite?code=…` and `https://ekkoconnect.app/invite?code=…` pre-fill the code; `signupApplication.myStatus` auto-advances on approved-app; build verified with `xcodebuild` ✅
- [ ] Decide on RLS approach. Currently access is enforced in tRPC middleware (`requireAccess`); Supabase RLS would be belt-and-suspenders but adds complexity. **Default: skip RLS, rely on tRPC gate.** Revisit if direct Supabase client access is added.

**Known dependency from iOS gating:** ~~"Apply for an invite" → 404~~ — resolved 2026-05-07 with the apply page. Both must ship together: if `apps/connect` is deployed without `apps/connect/app/apply/page.tsx`, the iOS button breaks again.

**Env-load gotcha:** `export $(grep -v '^#' .env.local | xargs)` breaks on URLs with `?`, `&`, `#` (Postgres conn strings always have these). Use `set -a && . ../../.env.local && set +a` instead from `packages/database/`.

#### Phase 2 — Invite mechanics

- [x] Code generation (in `invite.generate` + `invite.adminMint`)
- [x] Member balance tracking (`MemberInvite` model + `myBalance`/`listMine`)
- [x] Admin invite UI (2026-05-07): new "Invites" tab on `/admin` with mint form (count, isFounder, cohort, label, ttlDays), recently-minted code block with copy-all, filterable list with status chips + "Founders only" filter, copy-active-batch button. `invite.adminList` extended to include `issuedBy`/`redeemedBy` profiles.
- [ ] Member dashboard UI — single screen: balance, pending, redeemed, generate button. Power feature, not marketing surface.
- [ ] Monthly refresh job (Supabase scheduled function): top up to 3 for members active in last 30d. Skip dormant.
- [ ] Quality signal: surface `inviteeFirstPostAt` in admin view (silent, no member-facing punishment)

#### Phase 3 — Application surface

- [x] Public submit endpoint (`signupApplication.submit`)
- [x] Admin review endpoints (`listAdmin`, `review`, `adminStats`)
- [x] Admin review UI (2026-05-07): "Applications" tab on `/admin` with status chips (with counts), per-application card showing email/portfolio/disciplines/city/statement, inline cohort + notes input, three-button decision (Approve / Waitlist / Decline). Reviewed cards show admin notes inline.
- [x] Public apply page at `apps/connect/app/apply/page.tsx` (2026-05-07): UnicornScene background (same project IDs as landing), glass-card form, multi-select discipline chips (max 8), 280-char statement counter, optional referral code with `?ref=` / `?code=` URL pre-fill, success state replaces the form. Closes the iOS gate's "Apply for an invite" link → `https://www.ekkoconnect.app/apply`.
- [ ] Approve email — magic-link signup with one-time invite code
- [ ] Waitlist email — "We'll review again in 60 days"
- [ ] Decline = silent (no email)
- [ ] **Don't build:** scoring algorithms, ML, fancy admin UI. User curates first ~1000 by hand.

#### Phase 4 — Founders' circle

- [ ] Hand-pick ~75 across disciplines + 5–8 cities
- [ ] Mint founder codes via `invite.adminMint({ count: 5, isFounder: true, cohort: "FOUNDERS_S26" })`
- [ ] Private onboarding (Loom or written walkthrough)

#### Phase 5 — Soft launch (weeks 5–8 from go-live)

- [ ] Watch: which disciplines propagate, which founders are taste-makers vs spammers, whether proximity holds at 200/500/1000
- [ ] Adjust invite counts + refresh based on data
- [ ] Write public-facing narrative with real screenshots/users

#### Phase 6 — Public application opens (week 9+)

- [ ] Toggle `ekko.app/apply` live
- [ ] Cap approvals at 30/week initially
- [ ] Optional cohorts ("Spring '26 cohort, 200 spots")

### Architectural notes (invite system)

- **Gate enforcement** lives in `trpc.ts` `requireAccess` middleware, not RLS. Two procedure types: `pregatedProcedure` (auth'd but ungated — tiny allowlist of endpoints used to pass the gate) and `protectedProcedure` (auth'd + gated, the default).
- **Endpoints in the pregated allowlist:** `auth.me`, `auth.completeUserInfo`, `invite.validate`, `invite.redeem`, `signupApplication.myStatus`. Everything else is gated.
- **Idempotent redemption:** `invite.redeem` returns `{ ok: true, alreadyGated: true }` if the user is already gated, so a flaky-network retry from iOS doesn't brick anyone.
- **Admin-minted codes have `issuedByUserId=null`** — that's how we tell App Review codes / partnership codes apart from member-issued ones, and why `redeem` only writes a `MemberReferral` row when there's a real inviter.
- **Founder redemption** atomically flips `connectProfile.connectTier = INFINITE` (the existing premium tier system on connect profiles).
- **Slot refunding:** `revoke` of an unredeemed invite refunds the inviter's `availableCount`. Redeemed invites can't be revoked.
- **Code normalization:** users may type `A3F9-K2X7` or `a3f9k2x7`; we strip whitespace/hyphens and uppercase before lookup. Storage is canonical (uppercase, no separators).
- **iOS gate location:** `apps/connect-ios/EKKOConnect/Features/Auth/InviteGateView.swift`, wired into `AppRouter.swift` via `appState.needsInviteGate`. Deep-link parsing in `EKKOConnectApp.handleDeepLink` stashes `?code=` into `appState.pendingInviteCode` for the gate view to pick up. Sign-out clears the pending code so a leftover deep link can't redeem against a different account.
- **Admin UI lives in BOTH `apps/web` and `apps/connect`** (2026-05-07): the iOS app's tRPC backend is `apps/connect` at `www.ekkoconnect.app`, so the admin tabs were duplicated there at `apps/connect/components/admin/*` + `apps/connect/app/admin/page.tsx` (top-level, outside `(main)` so it skips the connect-profile redirect). Stats endpoint `admin.getDashboardStats` extended with `pendingApplications` + `activeInvites`. **If you change one, change both.** Long-term TODO: extract to a shared `packages/admin-ui` workspace.
- **Type extraction:** when typing tRPC procedure outputs in components, use `inferRouterOutputs<AppRouter>["foo"]["bar"]…` from `@trpc/server`. The `ReturnType<typeof trpc.foo.bar.useQuery>["data"]` pattern doesn't infer through this codebase's tRPC version and degrades to `{}`.

---

## Other completed features

See `~/.claude/projects/-Users-lucaorion-ekkomvp/memory/MEMORY.md` for the running list (feed, portfolios, profiles, search, follow, messaging, notifications, work orders, collectives, bookmarks, share, hashtags, trending, T&S, admin, premium tiers, analytics, video/audio uploads, landing page, onboarding, mobile responsiveness).

---

## Conventions for this file

- **Update in the same response that finishes the work.** Don't batch.
- Keep checkboxes accurate. `[x]` only when actually shipped (or, for backend-only work, when written + committed — note explicitly if DB push / iOS work is still pending).
- When a phase closes, leave it here as a record. Don't delete history.
- New initiatives get their own top-level section under "Active build" — don't squash unrelated work into one section.
- Cross-reference `MEMORY.md` for stable facts (tech stack, patterns, gotchas) — keep CLAUDE.md focused on **in-flight progress**.
