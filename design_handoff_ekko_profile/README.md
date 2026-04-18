# Handoff: ekko · Profile Screen (11 layout variants)

## Overview
This is the Profile screen for **ekko**, a creative networking / collab-matching app. It replaces the previous profile layout with a system of **11 swappable variants** — so the same profile data can be presented as a hero-forward portfolio, an editorial magazine page, a 3D artist rig, a musician's now-playing card, a photographer's contact sheet, a client rate card, a hiring brief, etc.

Aesthetic direction is **anime-inflected dark y2k**: shoujo sparkles, manga screen-tone, speed lines, Japanese furigana subtitles, abstract anime silhouettes on cover art.

## About the Design Files
The files in `src/` are **design references created in HTML + React (Babel-in-browser)** — prototypes showing intended look and behavior, NOT production code to copy directly.

Your task: **recreate these designs in the target ekko codebase's existing environment** (React Native / SwiftUI / Flutter / whatever ekko is built in), using its established patterns, design tokens, icon set, and navigation. Do not ship the inline-Babel HTML.

If ekko doesn't have an established profile module yet, scaffold one in the app's primary framework and port these layouts there.

## Fidelity
**High-fidelity.** Colors, type, spacing, interactions are final. Recreate pixel-perfectly using ekko's existing UI kit. Where ekko's kit differs (e.g. it uses SF Pro instead of Space Grotesk), substitute the equivalent token rather than overriding.

## The 11 Variants
All variants share the same header chrome (iOS status bar, "Profile" title, gear icon, status chip, Pause/Edit buttons) and tab bar. They swap out the body layout and data-emphasis:

1. **Hero** — full-bleed parallax cover, big name overlay, horizontal work rail, about + skills + stats + looking-for + socials
2. **Editorial** — magazine masthead, drop-cap bio, 2-col work grid with numbered captions, inline-stats footer
3. **Split** — short cover, vertical-text left rail with avatar + handle, right column with name + "NOW →" project card + about, full-bleed 3-col work grid
4. **Stack** — compact header, swipeable 3-card deck of work (prev/next controls), CTA button for current, skills, looking-for
5. **Terminal** — monospace command-line framing (`$ whoami`, `$ ls -la ./portfolio`), bordered ASCII-style stats, work as a data table, dashed dividers
6. **3D** — wireframe viewport card with spinning icosahedron on a grid floor, FPS/TC HUD, rig stats (polys/render hrs/clients), asset file library (`.glb`, `.usdz`, `.fbx`, etc. with tri counts + sizes), pipeline chips
7. **Music** — now-playing hero card with waveform + transport, track list with per-track mini-waveforms, play/BPM/key metadata, plays/releases/labels stats, signal-chain chips
8. **Video** — cinemascope 2.39:1 player with HUD overlays (REC, aspect, timecode), scrubber, horizontal reel carousel, minutes/spots/festivals stats, kit chips
9. **Photo** — featured 3:4 frame with EXIF overlay (cam/lens/ISO/shutter), 4×2 contact sheet with frame numbers, series list, bag chips
10. **Hire Me** — artist-as-freelancer: availability card (BOOKING chip, next date, slots, TZ, reply time), CTA row (Start a project + PDF), services/rate card with LEAD TIME, trusted-by horizontal scroll, pull-quote testimonials with accent bar, 4-step process, capabilities, final "Let's make something strange" CTA
11. **Client** — company hiring profile: brand hero with "HIRING · 3 OPEN" chip + VERIFIED badge, size/founded/reply meta, Apply/Star/Share CTA row, open briefs (with URGENT flag, budget, timeline, applicant count, tag chips), what-we-look-for numbered list, past-hires rail (gradient avatars), track-record stats (hires/avg time/replies/repeat), culture chips, final "Think you'd fit?" CTA

## Shared Chrome (all variants)
- **Status bar** — iOS time/signal/wifi/battery (dark mode, white glyphs)
- **Header row** — centered "Profile" title with furigana "プロフィール" above in 9px mono letter-spaced 0.3em. Right: circular gear button (36×36, `theme.cardBg`, 0.5px border).
- **Action row** — left: status chip (dot + label, pill with `theme.chipBg` and 0.5px border). Right: "Pause" (secondary pill, `theme.cardBg`) + "✎ Edit" (primary pill, `theme.fg` bg, `theme.bg` text). When editing, Edit button flips to accent bg with "✓ Done".
- **Tab bar** — floating pill at bottom, 12px inset, glass blur background, 4 tabs: Discover/Likes/Matches/Profile. Each tab has furigana line (探索/好き/縁/プロフィール) above label. Active tab has `theme.cardBg` and accent text.

## Design Tokens

### Colors (dark theme — default)
```
bg       #0A0A0E      background
cardBg   rgba(255,255,255,0.04)  cards / inset surfaces
fg       #F3F3F0      primary text
muted    rgba(243,243,240,0.5)   secondary text
border   rgba(255,255,255,0.1)   1-px and 0.5-px dividers
chipBg   rgba(255,255,255,0.06)  chips / tags
navBg    rgba(15,15,20,0.7)      tab bar background (w/ blur)
```

### Colors (light theme)
```
bg       #F5F4EE
cardBg   rgba(0,0,0,0.03)
fg       #0A0A0E
muted    rgba(10,10,14,0.55)
border   rgba(0,0,0,0.1)
chipBg   rgba(0,0,0,0.05)
navBg    rgba(255,255,255,0.7)
```

### Accents (user-selectable)
```
Sakura   #FF3D9A  ← default
Lime     #C4FF3D
Blood    #FF3D5A
Acid     #00E5A0
Violet   #B85CFF
Ember    #FF7A1A
Ice      #5EC7FF
```

### Typography
Default pair (`anime-shoujo`):
- **Display** — Zen Antique (Google Fonts) for headings, names, large numbers. Sub in an elegant serif if not available.
- **Body** — Zen Kaku Gothic New (Google Fonts) for paragraphs. Sub in a clean geometric sans.
- **Mono** — JetBrains Mono for labels, metadata, chip text, data tables.
- **Japanese/Furigana** — Noto Sans JP for small katakana subtitles above EN titles (letter-spacing 0.2–0.3em, 9–10px).

Alternate pairs available in Tweaks:
- `grotesk-serif`: Instrument Serif + Space Grotesk
- `anime-tech` (Mecha): Rampart One + Zen Kaku
- `mono-stack`: All JetBrains Mono
- `display-sans`: Archivo Black + Space Grotesk
- `blackletter`: UnifrakturCook + Space Grotesk (Y2K fraktur)

### Spacing
- Container padding: 16px (16–20px)
- Card padding: 14–18px
- Section-to-section gap: 20–22px
- Element gap inside card: 8–14px
- Chip padding: 5–10px horizontal, 3–5px vertical

### Border radius
- Pills: 999
- Cards: 10, 12, 14, 16, 18 (context-dependent)
- Small chips/buttons: 4, 6, 8
- Image thumbs: 4 (editorial/photo), 10–18 (hero/cover)

### Shadows
Mostly shadowless / border-led. Two exceptions:
- Cover hero: no shadow, gradient darkening at bottom
- Stack variant front card: `0 20px 40px rgba(0,0,0,0.4)`
- Tab bar: `0 8px 30px rgba(0,0,0,0.4)`
- Glass pills: soft inner shine (see IOSGlassPill)

## Interactions & Behavior
- **Variant switcher** — top-of-page chip row (outside device frame) lets you jump between all 11 layouts. In a production app this would move behind a Tweaks / A-B toggle or become permanent per context (creative → Hero/Editorial/..., hiring client → Client, etc.)
- **Edit mode** — `✎ Edit` button toggles `editing` state. In Hero variant, the bio becomes a contentEditable field with accent-tinted highlight (`rgba(196,255,61,0.08)` bg, inset 1px accent ring). Extend to other fields as needed.
- **Status toggle** — Pause/Resume toggles `status` between 'active' and 'paused'. StatusChip re-renders with a different dot color (`#34E27A` / `#FFB23D`).
- **Scroll parallax** — Hero cover translates `translateY(scrollY * 0.4)` and `scale(1 + scrollY * 0.0008)` for a gentle parallax effect. Listener on the device's inner scroller.
- **Portfolio detail** — Tapping any work card opens a bottom sheet (slideUp 0.3s cubic-bezier(.2,.8,.2,1)). Sheet has a 4×5 cover, tag/year/title/description, and "Open project →" + "♥" actions. Backdrop click closes.
- **Stack variant** — prev/next buttons rotate the 3-card stack with `translateY(depth * 14px) scale(1 - depth * 0.04)` offsets and opacity falloff.
- **Music variant** — ▶/⏸ toggles `isPlaying`; ⏭/⏮ cycle tracks. Active track in list has accent bg and a waveform tinted with the track's color.
- **Video variant** — Thumbnail click sets the active reel; scrubber stays static (visual only).
- **Photo variant** — Contact sheet cell click sets the featured frame; EXIF stripe updates accordingly.

## State Management
```
tweaks: {
  variant: 'hero' | 'editorial' | 'split' | 'stack' | 'terminal' | 'threeD' | 'music' | 'video' | 'photo' | 'hire' | 'client',
  dark: boolean,
  accent: hex,
  fontPair: string (see list above),
  avatarShape: 'flag' | 'circle' | 'squircle' | 'square' | 'none',
  coverStyle: 'fullbleed' | 'card',
}
editing: boolean           // edit mode
status: 'active' | 'paused' | 'focusing'
tab: 'discover' | 'likes' | 'matches' | 'profile'
detail: portfolioItem | null   // open detail sheet
profile: Profile              // see data.jsx for shape
scrollY: number               // for Hero parallax
```

## Assets
No raster assets in this handoff. All "cover art" is generated procedurally via `CoverPlaceholder` in `data.jsx`:
- Radial-gradient background tinted with `color` + `color2`
- Halftone dot pattern (manga screen-tone)
- Diagonal speed lines (SVG, optional via `anime` prop)
- Abstract anime silhouette (SVG: aura spikes + hair/shoulders + glowing eyes)
- Shoujo sparkles (SVG, 4-point stars)
- JetBrains Mono label at bottom-left, corner crosshair top-right

**In production**: swap CoverPlaceholder with real project imagery (user uploads) or keep the procedural version as a fallback when a project has no cover set. The silhouette/sparkle layers can be retained as an "anime filter" on top of user-uploaded images.

Avatar also procedural (see `atoms.jsx` → `Avatar`):
- `flag` — circular frame with a stylized flag-of-the-self motif (can be swapped for user's real flag/avatar)
- `circle`/`squircle`/`square` — N/W monogram glyph on conic-gradient halo
- `none` — hides entirely

## Data Shape
See `src/data.jsx` for the canonical `PROFILE` object. Key fields:
```
{ name, handle, role, location, status, gm,
  about, lookingFor[], currentProject,
  skills[], stats{matches,likes,projects,followers},
  socials[{label, handle}],
  portfolio[{id, title, year, tag, color, color2}]
}
```

Discipline-specific data in same file:
- `DISCIPLINE_DATA.threeD` — assets, software, rigs
- `DISCIPLINE_DATA.music` — tracks, gear, stats
- `DISCIPLINE_DATA.video` — reel, gear, stats
- `DISCIPLINE_DATA.photo` — frames, series, gear

Hire / Client data:
- `HIRE_DATA` in `variant-hire.jsx` — availability, services, clients, testimonials, process
- `CLIENT_DATA` in `variant-client.jsx` — company, briefs, pastHires, stats, culture, lookingFor

Japanese labels in `window.JP` (data.jsx) — names, roles, tab labels.

## Files
```
src/Portfolio Mockup.html    — entry point, loads Google Fonts + mounts React
src/ios-frame.jsx            — iOS device bezel, status bar, nav chrome (starter)
src/data.jsx                 — PROFILE + DISCIPLINE_DATA + JP + CoverPlaceholder
src/atoms.jsx                — Avatar, StatusChip, GmBadge, SkillChip,
                               TabBar, TopBar, IOSTopChrome, EditableText
src/variants.jsx             — Variants 1–5: Hero, Editorial, Split, Stack, Terminal
                               + shared sub-blocks (StatsRow, LookingForBlock, SocialsBlock)
src/variants-disciplines.jsx — Variants 6–9: 3D, Music, Video, Photo
                               + DISCIPLINE_DATA
src/variant-hire.jsx         — Variant 10: Hire Me + HIRE_DATA
src/variant-client.jsx       — Variant 11: Client + CLIENT_DATA
src/app.jsx                  — Root App, Tweaks panel, variant switcher,
                               detail sheet, state management
```

## Implementation Notes
- In the HTML prototype, all CoverPlaceholder/Avatar SVGs are inline. In the real app, consider extracting them to reusable components (e.g. `<AnimeCover color={} color2={} label={}/>`).
- Parallax is implemented via a scroll listener on the inner container. If ekko uses React Native, swap for `Animated.ScrollView` + interpolated translateY.
- Edit mode currently only wires up the Hero bio. Extend contentEditable (or native text inputs) to name, role, location, about, skills, looking-for, socials.
- The top chip-row variant switcher is for prototyping. In the real app, pick ONE variant per user context (e.g. Client users always see variant 11, photographers default to 9, etc.) — or expose as a user-selectable "Profile style" setting.
- Status chip has a third state `focusing` pre-built that uses the accent color — unused currently but available if you want to add it to the Pause toggle cycle.

## Caveats
- Characters used in the mock (NOVA.WRLD, Atelier Null, testimonial quotes) are placeholders. Replace with real data before ship.
- Japanese furigana strings are rendered via `window.JP` in `data.jsx`. Add i18n if you want the JP text to toggle with locale. Currently always-on as pure aesthetic.
- Icon glyphs (◎ ♥ ◉ ◈ ⚙ ✎ etc.) are Unicode placeholders. Swap to ekko's real icon set.
