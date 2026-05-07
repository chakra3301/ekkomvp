# EKKO Connect — Pitch Deck (Information Foundation)

**Product scope:** this deck is about **EKKO Connect for iOS** — the native iOS app for swipe + globe-based discovery and matchmaking between creatives, collaborators, and clients. The broader EKKO web platform exists alongside Connect and shares the user graph, but this deck is for the iOS app as the standalone product story.

**Stage:** native iOS MVP shipped. SwiftUI app with swipe stack, 3D globe discovery, multi-template profiles, native chat, matches with Live Activities, home-screen widgets, share cards, push notifications, in-app purchases via RevenueCat, and location-based matching.

**Document conventions:**
- `[VERIFY]` — stat to refresh with current sources before design.
- `[FOUNDER INPUT]` — fact only the founder/team can supply (traction, team, raise).
- Everything else describes the product as it currently exists in the codebase.

---

## Slide 1 — Cover

- **Brand:** EKKO Connect
- **One-liner:** The dating app for creative collaboration.
- **Sub-line option A:** Swipe, match, and hire creatives across the globe.
- **Sub-line option B:** Where creatives meet creatives — and the people who hire them.
- **Footer info:** Founder name, contact email, deck date, "Confidential."

---

## Slide 2 — The Problem

Creative people meeting other creative people — to collaborate, to hire, to be hired — is a broken experience on every platform that exists today.

**For creatives looking for work or collaborators:**
- LinkedIn is unusable. Creative portfolios don't render, the feed is B2B noise, no one swipes through it.
- Instagram is a vanity surface. There is no signal that a person is open to work, what disciplines they cover, or how to hire them.
- Behance / Dribbble / ArtStation are static portfolio walls. No two-way intent, no match mechanic, no chat.
- Upwork / Fiverr feel like begging for jobs. Profiles are templated, talent is interchangeable, no personality, no portfolio depth.
- DMing cold on Twitter or Instagram is the actual default — and it's a coin flip whether you ever get a reply.

**For people who want to hire creatives:**
- "Find a photographer in Lisbon who shoots fashion editorial and is available next month" requires search, scrolling, DMing, and ghosting. There is no tool for it.
- Portfolio sites have no concept of availability, location, rates, or willingness to take a job.
- There is no hire-button anywhere. Every contact is unstructured.

**The gap:** a Tinder-grade discovery experience built specifically for creative connection. Profile-rich, location-aware, mutual-intent, mobile-native, with a clean path from "we matched" to "we're working together."

---

## Slide 3 — The Insight

Three insights stacked on top of each other:

1. **Discovery is the unsolved problem in the creator economy.** Every creator platform has solved hosting (Behance), payments (Stripe), or work (Upwork). None has solved *finding the right person*. The default move — "post a story asking for recommendations" — is a confession that the tooling doesn't exist.

2. **The swipe is the right primitive for creative-to-creative connection.** Mutual opt-in removes cold DMs. Mobile-first matches how creatives actually scroll. Each card is a portfolio in itself, not a résumé.

3. **Creatives are the most visual users on earth and have been forced into the most generic UIs.** Connect ships 11 distinct profile templates (Hero, Editorial, Music, Photo, Video, 3D, Hire, Client, Stack, Split, Terminal) so a photographer's profile and a sound designer's profile don't look like the same Bumble card. This is the product's core aesthetic moat.

---

## Slide 4 — The Solution: EKKO Connect

EKKO Connect is a native iOS app that turns creative networking into a swipe-and-match experience.

**The core loop:**
1. Build a profile by picking the template that fits your work — Photo, Music, Video, 3D, Editorial, Hire, etc.
2. Open Discover. Swipe through a stack of creatives near you, browse a grid, or rotate a 3D globe of creatives worldwide.
3. Like the ones you want to connect with. If they like you back, it's a match.
4. Match opens a chat. A Live Activity appears on the lock screen and Dynamic Island. Share cards make matches and profiles instantly screenshottable.
5. Optional: send a structured *Inquiry* — a hire request — instead of small talk. Match → real project in one tap.

**What makes it different from a dating app:**
- Profile templates are creative-medium-specific, not "5 photos and a bio."
- Globe view shows creatives plotted by GPS — collaborate across cities and continents on purpose.
- Likes can carry a note (premium) so the first message is already in the match.
- Inquiries — structured booking forms for hire / client templates — convert chat into work.

**What makes it different from a portfolio site:**
- Mutual intent. No more cold DMs that get ignored.
- Mobile-native, real-time, social. Lives on your home screen, not in a browser tab.
- Profiles are alive — availability, rates, location, and active-now signals.

---

## Slide 5 — Why Now

- **Mobile is where creatives are.** The desktop portfolio era (Behance, Dribbble) was built for a different generation of designers. Today's creatives consume and showcase on phone.
- **The swipe is a universal mobile primitive now.** Tinder, Bumble, Hinge trained an entire generation to swipe to express intent. Connect inherits that fluency.
- **Native iOS surfaces are deeper than ever.** Live Activities, Dynamic Island, WidgetKit, and SceneKit make a discovery app feel like a system feature, not a webview. Connect uses all of them.
- **The creator economy hit professional inflection.** Independent creative work is no longer a side hustle — it's the default career. The market needs identity and discovery infrastructure built around it.
- **AI broke the bottom of the freelance market.** Generic Upwork / Fiverr work is being automated away. The remaining market is high-skill, vetted, portfolio-driven, and human — exactly what Connect's profile-rich, mutual-match model is built for.
- **No incumbent.** Tinder for X is a dead joke for most categories — but for professional creative connection, no real product exists. Connect is the first.

---

## Slide 6 — Market Opportunity

**Note to research:** all figures below are scaffolding — refresh with current sources before design.

- **Creator economy size:** $191–205B in 2024, projected $528B–$1.35T by 2030 (CAGR ~22–23%). [VERIFY]
- **Global professional creative workforce (target user count):** [VERIFY] across illustrators, designers, musicians, writers, animators, filmmakers, photographers, videographers, 3D artists, sound designers.
- **Mobile-app discovery analog comparables:**
  - Tinder — ~75M MAU, ~$1.9B 2024 revenue. [VERIFY]
  - Bumble — ~50M MAU, ~$1B 2024 revenue. [VERIFY]
  - Hinge — ~28M MAU, fastest-growing dating app. [VERIFY]
- **Creative platform comparables:**
  - Behance — ~30M users (Adobe). [VERIFY]
  - Dribbble — 13M members, ~$59M TTM revenue. [VERIFY]
  - ArtStation — niche, 3D/games/concept-art focused. [VERIFY]
- **Geographic priority:** NA + EU + APAC creative capitals (NYC, LA, London, Berlin, Tokyo, Seoul, Paris, Mexico City, São Paulo).

**TAM/SAM/SOM framing:**
- **TAM:** every working professional creative globally + every brand/agency that hires them.
- **SAM:** mobile-active creatives in NA + EU launch markets.
- **SOM:** verified, portfolio-active creatives in 4 launch cities + their inbound clients (12-month target).

---

## Slide 7 — How It Works (User Journeys)

### Onboarding (~3 minutes)
1. Sign up with email or Apple/Google.
2. Pick role: Creative or Client.
3. (Creative) Select disciplines from a multi-select list — Illustration, Design, Music, Writing, Animation, Film, Photography, Video, 3D, Sound Design, etc.
4. Upload media to slots — image, video, audio, 3D model. Each slot is a tile on your profile.
5. Pick a profile template (Hero, Editorial, Music, Photo, Video, 3D, Hire, Client, Stack, Split, Terminal, Default) — the one that visually matches your work.
6. Add prompts (text answers), bio, location (auto-detected or city override), links, availability.
7. Land in Discover.

### Discovery
- **Stack view** — swipe right to like, left to pass, full-screen card with media carousel.
- **Grid view** — 2-column thumbnail browse for fast scanning.
- **Globe view** — 3D globe with creatives plotted by GPS; rotate, tap a pin, open profile.
- **History view** — see who you've already swiped on, undo on premium.
- Filters: discipline, role (creative/client), distance, custom city, global search (premium).

### Matching
- Like → if they liked you back, instant match.
- Match celebration overlay animates.
- A Live Activity appears on the lock screen and Dynamic Island showing the match.
- Push notification fires (deep-linked to chat).

### Chat
- Native chat thread per match.
- Real-time via Supabase realtime channels.
- Audio messages (recorder built-in).
- Media sharing (image, video).
- Read receipts, unread badges.

### Hire / Inquiry flow
- Profiles using Hire or Client templates expose a structured inquiry form.
- Tap "Book a call" / "Apply now" → fill a short brief (project type, dates, budget).
- Inquiry lands as a structured message in chat.
- The hire path stays inside Connect — no separate app required.

### Sharing
- Each match and each profile generates a shareable card.
- Multiple card styles ship: TradingCard, Manga, Poster, Receipt, Terminal, VHS, ChromeFoil.
- One tap → share to iMessage, IG, Twitter — the cards are designed to be screenshotted and reposted, turning every match into organic distribution.

---

## Slide 8 — Product (What's Already Built)

This is a working native iOS MVP, not a deck-stage idea. The list below maps to shipped Swift code in the current repo.

### Discovery
- Swipe-card stack with full-screen media carousels.
- Browse grid view.
- 3D globe view rendered natively (SceneKit), creatives plotted by GPS, with custom coastline geometry.
- History view of past swipes.
- Filters by discipline, role, distance, city, global search (Infinite tier).
- Like-with-note flow (premium).
- View-mode toggle between stack / grid / globe / history.

### Profile templates (11 distinct layouts, all shipped)
- Default — base ConnectProfileCard.
- Hero — full-bleed hero variant.
- Editorial — magazine-style layout.
- Music — DAW-inspired, audio-forward.
- Photo — gallery-led, photographer profile.
- Video — reel-led video work.
- 3D — model-viewer-driven.
- Hire — built-in availability + booking CTA, structured for creatives selling services.
- Client — brand/company profile shown to creatives, with "Apply now" CTA.
- Stack — vertical-stack layout.
- Split — two-pane layout.
- Terminal — monospace / code-art aesthetic.

### Profile editing
- Editable avatar with cropper.
- Media slot grid: image, video, audio, 3D model uploads.
- Block-style section editors.
- Prompt editor (text answers).
- Per-template payload editing (each template has its own JSON payload model).

### Matching & messaging
- Match creation with celebration overlay.
- Native chat per match (Supabase realtime).
- Audio message recorder.
- Media sharing in chat.
- Match Live Activity (Dynamic Island + Lock Screen) via ActivityKit.
- Push notifications via APNs with deep-link routing.

### Likes & inquiries
- Likes inbox.
- Requests inbox (incoming inquiries).
- Inquiry forms tied to Hire / Client templates.

### Native iOS surfaces
- WidgetKit home-screen widget extension (EKKOConnectWidgets).
- ActivityKit Live Activities for matches.
- Deep linking + push routing.
- StoreKit 2 + RevenueCat for in-app purchase / Infinite subscription.
- Location services with privacy-first fallback (city override / global search for premium).
- Native audio recording (AVFoundation).

### Sharing & virality
- 7+ share-card styles: TradingCard, Manga, Poster, Receipt, Terminal, VHS, ChromeFoil.
- ShareCardRegistry to extend with new styles.
- Profile and match share-out flows.
- Instagram and Twitter preview composers.

### Trust & safety
- Report sheet (per-profile).
- Block / unblock.
- Server-side filtering of blocked / unmatched profiles from discovery queue.

### Settings & polish
- Theme system with light/dark.
- Glass-morphism design system.
- Custom tab bar.
- Toast system for in-app feedback.
- Skeleton loaders on every async surface.
- Japanese localization scaffolding (JPLabels) — internationalization architecture in place.
- Star sprite + custom animations for celebratory moments.

### Backend (shared with EKKO platform)
- tRPC routers: connect-discover, connect-profile, connect-match, connect-chat, connect-inquiry.
- PostgreSQL via Supabase, Prisma ORM.
- Supabase Auth, Storage (with RLS), Realtime channels.
- Stripe Connect (for hire flow on the broader platform; Connect-app monetization is via RevenueCat / StoreKit).

---

## Slide 9 — Differentiation

### Where Connect sits

| Capability | EKKO Connect | Tinder/Bumble/Hinge | Behance/Dribbble | Upwork/Fiverr | LinkedIn |
|---|---|---|---|---|---|
| Mutual-match discovery | Yes | Yes | No | No | Limited |
| Built for creatives specifically | Yes | No | Yes | Partial | No |
| Multi-medium profiles (image/video/audio/3D) | Yes | Photos only | Image/video | No | No |
| Multiple profile templates | 11 templates | Single template | Limited | Single | Single |
| 3D globe discovery | Yes | No | No | No | No |
| Hire/booking flow inside the app | Yes | No | No | Yes | No |
| Native iOS Live Activities + widgets | Yes | Partial | No | No | Limited |
| Share-card virality system | 7+ card styles | No | No | No | No |
| Mobile-native | Yes | Yes | No (web-first) | Web-first | Yes |

### Defensibility
- **Aesthetic moat** — the multi-template system is hard to replicate without rebuilding a design system per medium. Generic dating-style apps can't graft this on.
- **Network effect on a city basis** — globe + distance filters mean liquidity compounds locally first. NYC creatives drive NYC creatives.
- **Native depth** — Live Activities, WidgetKit, SceneKit globe, audio recording, share cards are all native. A web wrapper can't catch up.
- **Identity lock-in** — once a creative builds a profile here and has a match history, leaving means starting over.
- **Brand** — "match on Connect" becomes the verb for creative collaboration the way "swipe" became the verb for dating.

---

## Slide 10 — Business Model

### Revenue streams (in order of activation)

**1. Subscription — Connect Infinite — live**
- Tiered as: **FREE** vs **INFINITE**.
- Infinite unlocks: unlimited likes, see-who-liked-you, like-with-note, global / city-override search beyond local, undo last swipe, advanced filters.
- Billed via StoreKit 2 + RevenueCat — Apple-native subscription with the standard 70/30 (or 85/15 after year 1) split. [VERIFY pricing — currently configured in `Products.storekit`]
- Direct analog: Tinder Gold / Bumble Premium / Hinge HingeX.

**2. Hire-flow take rate — on roadmap**
- When a Connect inquiry converts into a paid Work Order on the EKKO platform, EKKO takes 10% of project value.
- Materially below Upwork (10–15%) and Fiverr (20–25%).
- Connect becomes both a subscription product and a top-of-funnel for transaction revenue.

**3. Promoted profiles — Phase 2**
- Pay to boost placement in the discover queue for a limited window (analog: Tinder Boost).
- Pay to feature in city-specific feeds.

**4. Verification — Phase 2**
- Red checkmark — paid identity verification.
- Black checkmark — vetted portfolio + premium identity.
- Platinum — invite-only, top-tier creatives + enterprise clients.

**5. Brand / agency accounts — Phase 3**
- Seat-based pricing for agencies and brands using Connect to source talent.
- Filtered access to vetted creative pool.
- Bulk inquiry / outreach tools.

### Unit economics (working assumptions)
- Free → Infinite conversion target: 5% of MAU. [VERIFY against current data]
- Infinite ARPU: [VERIFY against StoreKit configuration].
- Like-to-match rate: [FOUNDER INPUT — measured from current users].
- Match-to-chat rate: [FOUNDER INPUT].
- Match-to-Inquiry rate: [FOUNDER INPUT].
- Target LTV:CAC: 3:1.
- Comparison points: Tinder ARPU ~$18.50/yr (paying user). [VERIFY]

---

## Slide 11 — Go-to-Market

### Positioning sequence
1. **Land:** seed Connect in 4 creative-density cities — NYC, LA, London, Berlin. Founder-led outreach into existing creative networks. Use the swipe + globe demo as the wedge — it's instantly understandable and screenshottable.
2. **Spread:** lean on the share-card system. Every match and every profile is designed to be screenshotted and reposted. Instagram-first virality.
3. **Convert:** activate Infinite subscription once each launch city has 5,000+ active users and meaningful daily match volume.
4. **Expand:** add Tokyo, Seoul, Paris, Mexico City, São Paulo. Localize (Japanese localization scaffolding already in place).

### Phase 1 — Soft launch (months 0–3 from public launch)
- Target: 5,000 active users. [FOUNDER INPUT — current numbers]
- Geos: NYC, LA, London, Berlin.
- Tactics: invite-only waitlist, creative-school partnerships, founder DM outreach, agency seeding.
- Goal: prove repeat use of Connect (D7 retention >25%), measurable match volume per city.

### Phase 2 — Public launch (months 4–9)
- Target: 50,000 registered. [FOUNDER INPUT]
- Tactics: App Store launch + featuring push, Product Hunt, creative press (It's Nice That, Creative Boom, AIGA), Instagram creator seeding, paid TikTok.
- Goal: 5,000 verified profiles, Infinite paid conversion ramping.

### Phase 3 — Scale (year 2)
- Target: 200,000+ users.
- Add cities: Tokyo, Seoul, Paris, Mexico City, São Paulo.
- Activate brand/agency accounts.
- Promoted profiles + boost mechanics.

### Acquisition channels
- **Organic creator content** — share cards designed to be screenshotted and reposted.
- **Match moments** — Live Activity + Dynamic Island make matches feel system-native and shareable.
- **App Store organic** — first creative-collaboration mobile app to hit the App Store cleanly; category SEO opportunity.
- **Creative-school partnerships** — early student traction in target cities.
- **Press** — creative industry press loves a launch with a strong aesthetic POV.
- **Referral program** — invites unlock perks on both sides.

---

## Slide 12 — Traction & Validation

[FOUNDER INPUT — fill before sending externally.]

- **Built native iOS MVP:** confirmed — all features in slide 8 are shipped Swift code.
- **TestFlight beta size:** [FOUNDER INPUT].
- **Active users:** [FOUNDER INPUT].
- **DAU/WAU/MAU:** [FOUNDER INPUT].
- **D1 / D7 / D30 retention:** [FOUNDER INPUT].
- **Match volume per city:** [FOUNDER INPUT].
- **Likes per session:** [FOUNDER INPUT].
- **Beta cohort feedback (NPS, qualitative quotes):** [FOUNDER INPUT].
- **App Store review average:** [FOUNDER INPUT].
- **Press / inbound / waitlist:** [FOUNDER INPUT].

If traction numbers are too thin to anchor a slide, replace this with a "What's Built" slide — the product itself is the proof point at this stage.

---

## Slide 13 — Financial Projections

5-year forecast — scaffolding only. Refresh against current burn, raise target, and live metrics before sending.

**Note to research:** rebuild this table around (a) MAU, (b) Infinite conversion %, (c) Infinite ARPU, (d) hire-flow take-rate revenue once that activates.

| Metric | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|---|---|---|---|---|---|
| Registered users | 50,000 | 200,000 | 500,000 | 900,000 | 1,500,000 |
| MAU | 15,000 | 75,000 | 200,000 | 400,000 | 700,000 |
| Infinite subscribers | 750 | 5,000 | 15,000 | 30,000 | 55,000 |
| Subscription revenue | [VERIFY] | [VERIFY] | [VERIFY] | [VERIFY] | [VERIFY] |
| Hire-flow GMV | $0 | $5M | $20M | $50M | $100M |
| Hire-flow take revenue | $0 | $500K | $2M | $5M | $10M |
| Total revenue | [VERIFY] | [VERIFY] | [VERIFY] | [VERIFY] | [VERIFY] |
| Gross margin | 70% | 75% | 80% | 82% | 84% |

**Drivers:**
- Apple takes 30% (yr 1) / 15% (yr 2+) on Infinite — bake into gross margin.
- 10% take rate on Connect-originated Work Orders.
- Average project size $500. [VERIFY]
- Break-even targeted month 24.

**[VERIFY all rows against current burn, runway, and updated raise targets.]**

---

## Slide 14 — Tech Stack & Defensibility

### Stack as built
- **iOS app:** native Swift / SwiftUI (no React Native, no webview).
- **Native frameworks used:** SwiftUI, ActivityKit (Live Activities), WidgetKit (home-screen widgets), SceneKit (3D globe), AVFoundation (audio recording + playback), CoreLocation, StoreKit 2.
- **Subscriptions:** RevenueCat over StoreKit 2.
- **Push:** APNs with custom deep-link routing.
- **Backend:** tRPC routers running on the same Postgres + Supabase stack as the EKKO web platform.
- **Realtime:** Supabase realtime channels for chat + match events.
- **Storage:** Supabase Storage with RLS for user media.
- **i18n:** localization scaffolding in place; Japanese labels already authored.
- **Privacy:** PrivacyInfo.xcprivacy manifest shipped, location services gated and explainable.

### What this enables
- Connect feels like a system app — Dynamic Island, Live Activities, widgets — not a webview.
- Shared backend with the EKKO web platform means a single user graph, no double identity, low marginal cost to operate.
- RevenueCat gives mature subscription tooling without rolling our own billing.
- Supabase gives realtime + auth + storage + Postgres on one bill with a clean migration path as scale demands more dedicated infra.

### Defensibility
- Native depth on iOS is months of work for any web-wrapped competitor to replicate.
- The 11-template profile system is an aesthetic and engineering moat — each template has its own SwiftUI view, payload model, and editor.
- Globe view with custom coastline geometry is one of the few real differentiators that maps to a screenshot-shareable product moment.

---

## Slide 15 — Roadmap

### Now → next 90 days
- App Store launch (public).
- Push notifications fully wired across all match + chat events.
- Infinite tier billing live and stable on RevenueCat.
- Inquiry → Work Order handoff to EKKO platform.
- Real Stripe escrow on the platform side (so Connect-originated hires can complete in-platform).

### 3–6 months
- Android (native or React Native).
- AI-assisted discipline tagging on uploaded media.
- Promoted profile placements.
- Verification (Red checkmark) flow.
- Group chats for multi-creative collaborations.

### 6–12 months
- Brand / agency accounts with seat-based billing.
- City-specific feeds and curated drops.
- Smart matching v2 (model-driven, replacing rule-based).
- Profile template SDK — let creatives customize templates further.
- Localization rollout (JP, KR, FR, ES, DE).

### 12–24 months
- Connect-native events surface (workshops, IRL meetups in launch cities).
- Licensing module for hire flows (usage rights, AI consent).
- API for third-party integrations (Notion, Figma, Frame.io).

---

## Slide 16 — Team

[FOUNDER INPUT — fill before sending.]

- **[Founder name]** — Founder / CEO. Background. Why this person, this problem.
- **[Co-founder / CTO if applicable]** — Background.
- **[Other key team]** — designer, eng leads, advisors.
- **Advisors / investors of note** — names with one line on relevance.

If team is solo + small contractors: lean into "founder built a native iOS app with Live Activities, widgets, realtime chat, 11 profile templates, 7 share-card styles, and a 3D globe end-to-end" as evidence of execution.

---

## Slide 17 — The Ask

[FOUNDER INPUT]

- **Round:** [Pre-seed / Seed / Series A].
- **Raise size:** [$X].
- **Valuation / structure:** [SAFE / priced / cap].
- **Use of funds:** team / GTM / infra / ops.
- **Runway target:** [X months].
- **Milestones the round funds toward:** specific MAU, paid conversion, and hire-flow GMV targets that unlock the next round.

Working scaffold:
- Pre-seed / Seed: $1.5M–$2.5M, 18-month runway.
  - 60% team, 20% marketing (App Store + creator seeding), 10% infra, 10% ops/legal.
- Next-round trigger: 100K+ MAU, 5%+ Infinite conversion, $1M+ hire-flow GMV.

---

## Slide 18 — Vision / Closing

EKKO Connect is the discovery layer the creative economy never got. Tinder solved romantic intent. LinkedIn solved B2B credentialing. Behance solved hosting. None of them solved the actual problem of two creatives finding each other — or a brand finding the right creative — with mutual intent and a path to working together.

**3-year vision:** Connect is the default mobile app every working creative has on their home screen. Match is the verb. The globe is the icon. Every collaboration in 4 launch cities started on Connect.

**5-year vision:** Connect is the global rolodex of the creative economy — a live, location-aware, mutual-intent map of every working creative on earth, with a hire button next to every profile.

**Closing line:** Swipe. Match. Make something.

**Contact:** [FOUNDER INPUT — email, calendar link, deck date].

---

## Appendix A — Glossary

- **Match** — mutual like between two users; opens a chat thread.
- **Inquiry** — a structured booking request sent through chat from Hire/Client templates.
- **Profile template** — the layout style a creative picks for their profile (Hero, Editorial, Music, Photo, Video, 3D, Hire, Client, Stack, Split, Terminal, Default).
- **Stack / Grid / Globe / History** — the four discovery view modes.
- **Infinite** — Connect's premium tier. Unlocks unlimited likes, global search, like-with-note, see-who-liked-you, undo.
- **Like-with-note** — premium feature: attach a short message to a like; visible if it becomes a match.
- **Share card** — a screenshottable graphic generated from a match or profile, designed for IG/Twitter/iMessage. 7+ styles ship.
- **Live Activity** — iOS-native real-time surface on lock screen + Dynamic Island. Used for matches.

## Appendix B — Personas

### Creative — "Alex the illustrator"
- 28, Brooklyn, 5 years freelance digital illustration.
- Goals: meet other illustrators to collaborate with; meet art directors who hire.
- Pain: cold-DMing on Twitter is dead; Behance is just a portfolio wall; LinkedIn doesn't make sense.
- Connect value: swipes through art directors and other illustrators in NYC; matches turn into project conversations or coffee.

### Creative — "Mei the music producer"
- 24, LA, beat-maker working with vocalists.
- Goals: find vocalists, find sync clients, find other producers.
- Pain: Instagram DMs to vocalists are 90% ignored; SoundCloud has no signal of intent or availability.
- Connect value: Music template surfaces beats natively (audio waveforms); matches with vocalists trigger collab chats with audio messages.

### Brand client — "Maya the marketing director"
- 35, San Francisco, mid-stage tech company.
- Needs: rotating illustration, video, motion work for content + campaigns.
- Pain: vetting cold; juggling DMs and freelancers.
- Connect value: filters to creatives by discipline, location, availability; sends an Inquiry; pre-vetted via portfolio depth.

### Indie filmmaker — "Theo"
- 31, LA, hires composer + colorist + sound designer per project.
- Pain: assembling a creative team across email/DMs is slow.
- Connect value: globe view + discipline filter to source the team; group chat (roadmap) coordinates them.

## Appendix C — Risks & mitigations (concise)

- **Cold-start liquidity** — seeded city-by-city via founder-led creative outreach. Globe + distance filters make local liquidity feel dense early.
- **Dating-app stigma** — positioning is explicit: Connect is for *creative* connection. Profile templates and discipline filters make it visually impossible to confuse with Tinder.
- **Apple platform risk** — 30%/15% take is baked into gross margin. Hire-flow take rate (off-Apple) is the long-term margin driver.
- **Trust & safety** — report/block live, server-side filtering of blocked profiles; verification tiers planned for Phase 2.
- **Big-tech entry** — speed and native depth as moat; identity lock-in once profiles + match history are anchored.
- **Match → real outcome conversion** — the inquiry system + hire flow on platform are the answer. Connect is not just a chat app; it's a hire app.

---

**End of foundation document. Hand off to research pass next.**
