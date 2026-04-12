# EKKO Connect — Native Swift iOS Rebuild Prompt

You are rebuilding EKKO Connect as a native Swift iOS app. This is a creative-industry networking/matching app (similar to dating apps but for creatives and clients). The existing app is a Next.js/React PWA wrapped in Capacitor. You are rebuilding it as a fully native SwiftUI app that talks to the same Supabase backend and tRPC API.

---

## TECH STACK FOR THE SWIFT APP

- **UI:** SwiftUI (iOS 17+)
- **Architecture:** MVVM with async/await
- **Networking:** URLSession + a lightweight tRPC-compatible HTTP client (JSON-RPC over HTTP POST to `/api/trpc/<procedure>`)
- **Auth:** Supabase Swift SDK (`supabase-swift`)
- **Storage:** Supabase Storage (S3-compatible, same buckets)
- **Real-time:** Supabase Realtime Swift SDK (WebSocket channels for chat)
- **Push Notifications:** APNs via Supabase or FCM
- **Image Loading:** AsyncImage or Kingfisher/SDWebImage
- **Geolocation:** CoreLocation
- **3D Models:** SceneKit or RealityKit (for .glb/.usdz files)
- **Media Playback:** AVFoundation (video/audio)
- **IAP:** RevenueCat SDK
- **Local Storage:** UserDefaults for preferences, Keychain for tokens

---

## BACKEND API CONTRACT

The backend uses tRPC. Each procedure is called via HTTP:
```
POST /api/trpc/<routerName>.<procedureName>
Content-Type: application/json
Authorization: Bearer <supabase_access_token>

// For queries:
GET /api/trpc/<routerName>.<procedureName>?input=<url_encoded_json>

// For mutations:
POST /api/trpc/<routerName>.<procedureName>
Body: { "json": { ...input } }
```

The base URL is your Connect app's API URL (e.g., `https://connect.ekko.app/api/trpc`).

---

## DATABASE MODELS (Prisma → Swift structs)

### User
```swift
struct User: Codable, Identifiable {
    let id: UUID
    let email: String
    let phone: String?
    let dateOfBirth: Date?
    let role: UserRole // CREATIVE | CLIENT | ADMIN
    let status: UserStatus // ACTIVE | SUSPENDED
    let emailVerified: Bool
    let onboarded: Bool
    let pushToken: String?
    let pushPlatform: String?
    let createdAt: Date
    let updatedAt: Date
}

enum UserRole: String, Codable {
    case CREATIVE, CLIENT, ADMIN
}
```

### Profile (main Ekko profile, needed for display name/avatar)
```swift
struct Profile: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let username: String
    let displayName: String
    let bio: String?
    let headline: String?
    let avatarUrl: String?
    let bannerUrl: String?
    let location: String?
    let subscriptionTier: String? // FREE | PRO | BUSINESS
}
```

### ConnectProfile
```swift
struct ConnectProfile: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var headline: String?
    var lookingFor: String?
    var bio: String?
    var mediaSlots: [MediaSlot] // JSON array
    var prompts: [PromptEntry] // JSON array
    var instagramHandle: String?
    var twitterHandle: String?
    var linkedinHandle: String?
    var websiteUrl: String?
    var instagramAccessToken: String?
    var instagramTokenExpiry: Date?
    var instagramUserId: String?
    var disciplineIds: [UUID]
    var location: String?
    var latitude: Double?
    var longitude: Double?
    var likesReceivedCount: Int
    var matchesCount: Int
    var isActive: Bool
    var connectTier: ConnectTier // FREE | INFINITE
    let createdAt: Date
    let updatedAt: Date
    
    // Nested from API responses:
    var user: UserWithProfile?
}

struct MediaSlot: Codable {
    let url: String
    let mediaType: String // "PHOTO" | "VIDEO" | "AUDIO" | "MODEL"
    let sortOrder: Int
}

struct PromptEntry: Codable {
    var question: String
    var answer: String
    var isCustom: Bool?
}

enum ConnectTier: String, Codable {
    case FREE, INFINITE
}
```

### ConnectSwipe
```swift
struct ConnectSwipe: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let targetUserId: UUID
    let type: SwipeType // LIKE | PASS
    let likedContentType: String? // PHOTO | VIDEO | AUDIO | MODEL | PROMPT
    let likedContentIndex: Int?
    let matchNote: String? // max 255 chars
    let createdAt: Date
    
    // Nested:
    var targetUser: UserWithProfile?
    var user: UserWithProfile?
}

enum SwipeType: String, Codable {
    case LIKE, PASS
}
```

### ConnectMatch
```swift
struct ConnectMatch: Codable, Identifiable {
    let id: UUID
    let user1Id: UUID
    let user2Id: UUID
    let status: MatchStatus // ACTIVE | UNMATCHED
    let ekkoConversationId: UUID?
    let createdAt: Date
    let updatedAt: Date
    
    // Nested:
    var user1: UserWithProfile?
    var user2: UserWithProfile?
    var messages: [ConnectMessage]?
}

enum MatchStatus: String, Codable {
    case ACTIVE, UNMATCHED
}
```

### ConnectMessage
```swift
struct ConnectMessage: Codable, Identifiable {
    let id: UUID
    let matchId: UUID
    let senderId: UUID
    let content: String // max 1000 chars
    let imageUrl: String?
    let readAt: Date?
    let createdAt: Date
    
    // Nested:
    var sender: UserWithProfile?
}
```

### Helper type used in API responses
```swift
struct UserWithProfile: Codable {
    let id: UUID
    let email: String
    let role: UserRole
    let profile: Profile?
    let connectProfile: ConnectProfile?
}
```

---

## API PROCEDURES (tRPC routes to implement as Swift networking calls)

### Auth Router (`auth.*`)

| Procedure | Type | Input | Output | Description |
|-----------|------|-------|--------|-------------|
| `auth.getSession` | query | none | User? | Get current session |
| `auth.me` | query | none | User | Get authenticated user |
| `auth.completeUserInfo` | mutation | `{ fullName: String, phone?: String, dateOfBirth?: String, role?: "CREATIVE"\|"CLIENT" }` | User | Set name, DOB, role after OAuth |

### Profile Router (`profile.*`)

| Procedure | Type | Input | Output | Description |
|-----------|------|-------|--------|-------------|
| `profile.getCurrent` | query | none | Profile | Current user's profile |
| `profile.update` | mutation | `{ displayName, username, bio?, headline?, location?, ... }` | Profile | Update/create profile (upsert) |

### Connect Profile Router (`connectProfile.*`)

| Procedure | Type | Input | Output | Description |
|-----------|------|-------|--------|-------------|
| `connectProfile.getCurrent` | query | none | ConnectProfile? | Current user's connect profile with nested user.profile |
| `connectProfile.getById` | query | `{ profileId: UUID }` | ConnectProfile | Any profile by ID |
| `connectProfile.create` | mutation | ProfilePayload | ConnectProfile | Create initial connect profile |
| `connectProfile.update` | mutation | ProfilePayload | ConnectProfile | Update existing connect profile |
| `connectProfile.disconnectInstagram` | mutation | none | success | Clear Instagram OAuth |
| `connectProfile.toggleActive` | mutation | none | `{ isActive: Bool }` | Pause/resume visibility |
| `connectProfile.upgradeTier` | mutation | `{ tier: "FREE"\|"INFINITE" }` | ConnectProfile | Post-IAP tier update |

**ProfilePayload:**
```swift
struct ProfilePayload: Codable {
    var headline: String?
    var lookingFor: String?
    var bio: String?
    var mediaSlots: [MediaSlot]
    var prompts: [PromptEntry]
    var instagramHandle: String?
    var twitterHandle: String?
    var websiteUrl: String?
    var disciplineIds: [UUID]?
    var location: String?
    var latitude: Double?
    var longitude: Double?
}
```

### Connect Discover Router (`connectDiscover.*`)

| Procedure | Type | Input | Output | Description |
|-----------|------|-------|--------|-------------|
| `connectDiscover.getDiscoveryQueue` | query | `{ limit: 1-20, filters? }` | `[ConnectProfile]` | Profiles to swipe on |
| `connectDiscover.getLikesReceived` | query | `{ cursor?: UUID, limit: 1-50 }` | `{ likes: [ConnectSwipe], nextCursor?: UUID }` | Incoming likes |
| `connectDiscover.getSwipeHistory` | query | `{ cursor?: UUID, limit: 1-50 }` | `{ items: [...], nextCursor?: UUID }` | Past swipes |

**Discovery Filters:**
```swift
struct DiscoveryFilters: Codable {
    var disciplineIds: [UUID]?
    var role: String? // "CREATIVE" | "CLIENT" | "ALL"
    var location: String?
    var latitude: Double?
    var longitude: Double?
    var maxDistanceMiles: Int?
    var globalSearch: Bool?
}
```

**Discovery Queue Ordering:**
1. connectTier DESC (INFINITE first)
2. likesReceivedCount DESC
3. matchesCount DESC
4. updatedAt DESC

**Exclusions:** Self, already swiped, blocked users (both directions), inactive profiles

### Connect Match Router (`connectMatch.*`)

| Procedure | Type | Input | Output | Description |
|-----------|------|-------|--------|-------------|
| `connectMatch.swipe` | mutation | `{ targetUserId, type, likedContentType?, likedContentIndex?, matchNote? }` | `{ matched: Bool, matchId?: UUID }` | Like or pass |
| `connectMatch.getMatches` | query | `{ cursor?, limit }` | `{ matches: [...], nextCursor? }` | Active matches with last message |
| `connectMatch.getMatch` | query | `{ matchId }` | ConnectMatch | Single match detail |
| `connectMatch.undoLastSwipe` | mutation | none | `{ success, undoneTargetUserId, undoneType }` | Undo within 30s |
| `connectMatch.unmatch` | mutation | `{ matchId }` | `{ success }` | End a match |

**Swipe Business Logic:**
- On LIKE: increment target's `likesReceivedCount`, send push notification
- Mutual match detection: if target also liked current user → create ConnectMatch, increment both `matchesCount`, send push to both
- Match user IDs are normalized: `[user1Id, user2Id].sort()` for uniqueness
- Undo: only works within 30 seconds of swipe, deletes swipe record

### Connect Chat Router (`connectChat.*`)

| Procedure | Type | Input | Output | Description |
|-----------|------|-------|--------|-------------|
| `connectChat.getMessages` | query | `{ matchId, cursor?, limit }` | `{ messages: [...], nextCursor? }` | Paginated messages (newest first) |
| `connectChat.sendMessage` | mutation | `{ matchId, content?, imageUrl? }` | ConnectMessage | Send text or image |
| `connectChat.markAsRead` | mutation | `{ matchId }` | `{ success }` | Mark all as read |
| `connectChat.getUnreadCount` | query | none | `{ count: Int }` | Total unread across all matches |
| `connectChat.bridgeToEkko` | mutation | `{ matchId }` | `{ conversationId }` | Link to main EKKO messaging |

### Block Router (`block.*`)

| Procedure | Type | Input | Output | Description |
|-----------|------|-------|--------|-------------|
| `block.block` | mutation | `{ userId }` | success | Block a user |
| `block.unblock` | mutation | `userId` | success | Unblock a user |
| `block.getBlockedUsers` | query | none | `[BlockedUser]` | List blocked users |

### Report Router (`report.*`)

| Procedure | Type | Input | Output | Description |
|-----------|------|-------|--------|-------------|
| `report.report` | mutation | `{ targetType, targetId, reason, details? }` | success | Report user/content |

---

## APP SCREENS & NAVIGATION

### Navigation Structure
```
TabView (4 tabs):
├── Discover (Compass icon)
├── Likes (Heart icon)  
├── Matches (MessageCircle icon) — badge: unread count
└── Profile (User icon)

Plus:
├── Settings (gear icon in top-right header)
├── Chat (push from Matches)
└── Profile Setup (push from Profile)
```

### Global Layout
- **Top bar:** Fixed header with EKKO logo (left) + Settings gear icon (right), 44pt height + safe area
- **Bottom tab bar:** 4 tabs with icons + labels, 49pt height + safe area
- **Glass morphism** styling throughout (translucent backgrounds with blur)

---

### Screen 1: REGISTER (`/register`)

**Layout:** Centered card form, scrollable

**Fields:**
1. Full Name (2-50 chars, char counter)
2. Contact mode toggle: Phone or Email
3. Phone field (tel input, "+1 (555) 000-0000")
4. Email field (always required for verification, shown separately if phone is primary)
5. Date of Birth — 3 dropdown pickers: Month (January-December), Day (1-31 dynamic), Year (current year going back 100 years)
   - Age validation: must be >= 13 years old
   - Helper text: "This will not be shown publicly. Confirm your own age, even if this account is for a business, a pet, or something else."
6. Password (min 8 chars)
7. Terms checkbox: "I agree to the Terms of Service and Privacy Policy. I understand there is zero tolerance for objectionable content or abusive behavior."
8. Submit button: "Next" (disabled until terms checked)

**OAuth:** Google + Apple Sign In buttons above the form (with "Or" divider)

**Auth Flow:**
- Email signup via `supabase.auth.signUp(email, password, metadata: { full_name, phone, date_of_birth })`
- OAuth via Supabase OAuth flow (Google, Apple)
- After signup: redirect to login (email verification required)

### Screen 2: LOGIN (`/login`)

**Layout:** Centered card form

**Fields:**
1. Email
2. Password
3. Submit: "Sign in"
4. OAuth buttons (Google, Apple)

**Post-login routing:**
- If no DOB on user record → Complete Profile
- If no ConnectProfile → Profile Setup
- Otherwise → Discover

### Screen 3: COMPLETE PROFILE (2-step wizard)

**Step indicator:** Numbered circles (1, 2) with connecting line, filled = current/completed

**Step 1 — "About You":**
- Display Name text field (pre-populated from OAuth provider if available)
- Date of Birth date picker (max = today, validate age >= 13)
- Helper: "This will not be shown publicly."
- "Next" button (validates before proceeding)

**Step 2 — "Your Role":**
- Two large tappable cards:
  - **Creative** — Palette icon, "I create work and want to connect with others"
  - **Client** — Briefcase icon, "I'm looking to find and hire creatives"
- Selected card: primary color border + light primary background
- "Continue" button (disabled until role selected)

**On submit:**
1. Auto-generate username from display name: `lowercased, only [a-z0-9_], max 20 chars`
2. Call `auth.completeUserInfo({ fullName, dateOfBirth, role })`
3. Call `profile.update({ displayName, username })`
4. Navigate to Profile Setup

### Screen 4: PROFILE SETUP (4-step wizard)

Used for BOTH creating and editing a Connect profile. When editing, pre-populate all fields from existing profile.

**Step indicator:** Numbered circles (1-4) with connecting lines

**Step 1 — "Media" (required: >= 1 slot):**
- Grid of 6 upload slots
- Layout: First slot is large (featured, 2x2), remaining 5 are small (1x1) arranged as 2 small on right of featured + 3 across bottom
- Each slot: dashed border, "+" icon, "Featured" label on first slot
- Tap to upload from photo library / camera
- Supported types:
  - Photos (max 10MB)
  - Videos (max 50MB)
  - Audio (max 20MB)
  - 3D Models: .glb, .gltf, .obj, .fbx, .usdz (max 50MB)
- Upload to Supabase Storage: `connect/{userId}/{type}-{timestamp}.{ext}`
- Show media preview after upload (image thumbnail, video player, audio waveform, 3D viewer)
- Tap filled slot to remove (X button overlay)
- "Next" button disabled until >= 1 slot filled

**Step 2 — "Prompts" (required: >= 1):**
- List of prompt cards
- Each card: question dropdown + answer textarea (500 chars max)
- 15 predefined prompts:
  ```
  "My most creative project was..."
  "I'm looking to collaborate on..."
  "A skill I want to learn is..."
  "My dream creative project would be..."
  "The medium I'm most passionate about is..."
  "I get inspired by..."
  "My creative process usually starts with..."
  "A project I'm most proud of is..."
  "I believe great design/art should..."
  "Something surprising about my work is..."
  "The best feedback I ever received was..."
  "I'm currently working on..."
  "My creative superpower is..."
  "I want to connect with people who..."
  "A tool I can't live without is..."
  ```
- "Write your own..." option for custom questions (max 150 chars)
- "Add Prompt" button (max 3 prompts)
- Remove prompt via X button
- "Next" button disabled until >= 1 prompt with non-empty answer

**Step 3 — "Details" (all optional):**
- Bio textarea (500 chars, char counter)
- Headline text field (200 chars)
- "What are you looking for?" textarea (500 chars)
- Location text field
- Social Links section:
  - Instagram: @ prefix + handle input
  - X/Twitter: @ prefix + handle input  
  - Website: URL input

**Step 4 — "Preview":**
- Full ConnectProfileCard preview (scrollable)
- Shows exactly what others will see in Discover
- "Activate Profile" button (new) or "Save Changes" (editing)

**Navigation:** Back/Next buttons at bottom, disabled states based on validation

### Screen 5: DISCOVER

**Three view modes** (toggle in top-right):

#### Stack Mode (default) — Tinder-style card swiping:
- Cards stacked with slight scale/offset for depth
- **Swipe right** = LIKE, **swipe left** = PASS
- Swipe indicators: "LIKE" text (green, rotated, top-right) fades in on right drag, "PASS" text (red, rotated, top-left) fades in on left drag
- Card physics: spring animation, elastic snapping, velocity-based throw

**Card content (collapsed):**
- Featured media as full-bleed hero image
- Bottom gradient overlay (black → transparent)
- Display name (bold, white)
- Headline (smaller, white/80%)
- Location with MapPin icon
- Discipline badges (max 3, pill shaped)
- Infinity badge if INFINITE tier
- More menu (...) → Block, Report

**Card content (expanded — tap to expand):**
- Full-screen overlay, drag down to dismiss
- Drag handle bar at top
- Full ConnectProfileCard content (scrollable):
  - Hero media
  - Name, headline, location
  - Bio section
  - "Looking for" section
  - All media slots (gallery)
  - Prompt Q&As
  - Social links
  - Disciplines
- Action buttons pinned at bottom: Pass (X) | Like (Heart)

**After LIKE swipe:**
- Optional "like note" prompt (bottom sheet):
  - Text input (max 200 chars)
  - "Send" and "Skip" buttons
- If mutual match detected (API returns `matched: true`):
  - Match celebration overlay:
    - Both avatars/photos
    - "It's a Match!" text
    - "Send Message" CTA → navigate to chat
    - "Keep Swiping" dismiss

**Undo button:** Appears for 30 seconds after any swipe. Tap to undo last swipe.

**Empty state:** "You've seen everyone! Check back later." or "No profiles found" with filter suggestions.

#### Grid Mode:
- 2-column grid of profile cards
- Each card: featured image (3:4 aspect ratio), name overlay at bottom
- Tap to view full profile (same expanded view as stack)

#### History Mode:
- List of previously swiped profiles
- Shows swipe type indicator (green heart for LIKE, red X for PASS)
- Cursor-based pagination (load more on scroll)

**Filters** (persisted in UserDefaults):
- City/location text search
- Max distance slider (10-200 miles, only works if user has GPS location)
- Global search toggle (ignores distance)
- Role filter: Everyone | Creatives | Clients

### Screen 6: LIKES

**Layout:** 2-column grid

**Like cards:**
- 3:4 aspect ratio
- Featured photo (or avatar fallback)
- Gradient overlay at bottom
- Display name
- Match note in italics (if provided by the liker)
- Two action buttons at bottom: Pass (X icon) | Like Back (Heart icon)

**Interactions:**
- Like Back → calls `swipe(LIKE)` → if mutual match, show celebration
- Pass → calls `swipe(PASS)` → removes from list

**Empty state:** Heart icon + "No likes yet" + "Build a strong profile to get noticed!"

**Pagination:** Cursor-based, load 20 at a time

### Screen 7: MATCHES

**Layout:** Two sections

**Section 1 — "New Matches" (horizontal scroll):**
- Row of circular avatars (64x64pt)
- Display name below each
- Tap → navigate to chat

**Section 2 — "Messages" (vertical list):**
- Each row:
  - Avatar (56x56pt)
  - Display name (bold)
  - Last message preview (truncated, gray text)
  - If sent by current user: prefix "You: "
  - If image message: "📷 Photo"
  - Relative timestamp ("2h", "3d", etc.)
- Tap → navigate to chat

**Empty state:** "No matches yet" + "Start discovering to find your creative match!"

**Badge:** Unread message count on Matches tab icon

### Screen 8: CHAT (`/matches/{matchId}`)

**Layout:** Full-screen chat interface

**Header:**
- Back arrow
- Avatar + display name (tappable → opens profile sheet)
- More menu (...): Unmatch, Block, Report, Bridge to EKKO

**Message list (ScrollView, reversed):**
- **Sent messages:** Right-aligned, primary color background, rounded corners (rounded bottom-right is less rounded)
- **Received messages:** Left-aligned, translucent glass background, rounded corners (rounded bottom-left is less rounded)
- Timestamp below each message (small, muted text)
- **Read receipts:**
  - Single checkmark = sent
  - Double checkmark (blue/sky color) = read
- **Image messages:** 192pt wide thumbnail, tap to view full-screen
- **Typing indicator:** Three bouncing dots animation (when other user is typing, 3-second timeout)
- **Empty state:** "You matched with [Name]! Break the ice and say hello."

**Message input bar (bottom, above keyboard):**
- Image picker button (camera/photo icon)
- Text field (auto-grow, placeholder: "Message...")
- Send button (arrow icon, primary color, disabled when empty)
- Image upload: max 5MB, stored at `connect/chat/{matchId}/{userId}-{timestamp}.{ext}`

**Real-time features (via Supabase Realtime channel `chat:{matchId}`):**
- New messages: `postgres_changes` INSERT on `connect_messages` table
- Typing indicator: broadcast event `typing` with `{ userId }`, throttled to once per 2 seconds
- Read receipts: broadcast event `read` with `{ userId }`
- Auto-scroll to bottom on new message
- Mark as read on view + when receiving new messages

**Profile sheet (bottom sheet, 85% height):**
- Drag handle at top
- Full ConnectProfileCard content (scrollable)
- Drag down to dismiss

### Screen 9: PROFILE

**Layout:** Full profile view

**Action bar (top):**
- Status indicator: "Active" (green eye icon) or "Paused" (gray eye-off icon)
- Pause/Activate toggle button
- Edit button → navigates to Profile Setup (edit mode)

**Content:**
- Full ConnectProfileCard preview
- Stats row: Likes Received count | Matches count

**Empty state (no ConnectProfile):**
- Person icon
- "No Connect Profile Yet"
- "Set up your profile" CTA button → Profile Setup

### Screen 10: SETTINGS

**Sections (scrollable list of cards):**

#### Profile Section
- Profile preview row: avatar + display name + headline → taps to Profile
- Edit Profile → Profile Setup
- Profile Visibility toggle (Active/Hidden switch)

#### Account Settings Section
- Display Name — shows current name + "Edit" button
  - Tap Edit → inline text field with Save/Cancel
  - Validation: min 2 chars

#### Appearance Section
- Three buttons: Light (Sun) | Dark (Moon) | System (Monitor)
- Selected button has primary highlight

#### Discovery Filters Section
- Location text field + "Use my location" GPS button
- Max distance slider (10-200mi)
- Global Search toggle
- Role filter: Everyone | Creatives | Clients buttons

#### Blocked Users Section
- List of blocked users with avatar + name + "Unblock" button
- Empty state: "No blocked users"

#### Account Section
- Email display (read-only)
- Privacy Policy link
- Terms of Service link
- Sign Out button (red text)
- Delete Account (expandable confirmation):
  - Warning text
  - Type "DELETE" to confirm
  - Cancel / Delete buttons

---

## CONNECT PROFILE CARD COMPONENT

This is a reusable component used in: Discover (expanded), Profile, Profile Setup preview, Chat profile sheet, Likes.

**Layout (scrollable):**
1. **Hero media** — featured slot (first media), full-width, 4:5 aspect ratio
   - If video: auto-play muted with play button overlay
   - If audio: waveform visualization
   - If 3D model: interactive 3D viewer (SceneKit/RealityKit)
2. **Info overlay on hero** (bottom gradient):
   - Display name (large, bold, white)
   - Headline (medium, white/80%)
   - Location + MapPin icon (small, white/60%)
3. **Media gallery** (horizontal scroll, if > 1 media slot):
   - Thumbnails of all media slots
   - Tap to view full-screen
4. **Bio section** (if bio exists):
   - "About" header
   - Bio text
5. **Looking For section** (if lookingFor exists):
   - "Looking for" header
   - Text
6. **Prompts section** (glass cards):
   - Each prompt: question in bold/small, answer in regular
7. **Disciplines** (horizontal pills/badges)
8. **Social links** (icon + handle/URL for each):
   - Instagram (@handle)
   - X/Twitter (@handle)
   - Website (URL)
9. **Tier badge:** If INFINITE tier, show infinity symbol badge

---

## MEDIA UPLOAD

### Supabase Storage Bucket: `portfolio`

### Upload paths:
- Profile media: `connect/{userId}/{type}-{timestamp}.{ext}` where type = img|video|audio|model
- Chat images: `connect/chat/{matchId}/{userId}-{timestamp}.{ext}`

### File size limits:
- Images: 10MB
- Videos: 50MB
- Audio: 20MB
- 3D Models: 50MB (.glb, .gltf, .obj, .fbx, .usdz)
- Chat images: 5MB

### Media type detection (from URL):
```swift
func isVideo(_ url: String) -> Bool { url.matches(/\.(mp4|webm|mov)(\?|$)/i) || url.contains("/video-") }
func isAudio(_ url: String) -> Bool { url.matches(/\.(mp3|wav|ogg|aac)(\?|$)/i) || url.contains("/audio-") }
func isModel(_ url: String) -> Bool { url.matches(/\.(glb|gltf|obj|fbx|usdz)(\?|$)/i) || url.contains("/model-") }
```

---

## PUSH NOTIFICATIONS

### Types:

| Type | Title | Body | Deep Link |
|------|-------|------|-----------|
| CONNECT_LIKE | "Ekko Connect" | "Someone liked your profile" | /likes |
| CONNECT_MATCH | "It's a Match!" | "You and [Name] both liked each other" | /matches/{matchId} |
| CONNECT_MESSAGE | "[SenderName]" | "[message preview, 50 chars]" or "📷 Photo" | /matches/{matchId} |

### Registration:
1. Request APNs permission
2. Get device token
3. Store token on backend via tRPC or Supabase user metadata

---

## REAL-TIME (Supabase Realtime)

### Chat channel: `chat:{matchId}`

**Subscriptions:**
1. `postgres_changes` — INSERT on `connect_messages` where `match_id = matchId`
   - On new message from other user: append to messages, auto-scroll, increment signal
2. Broadcast event `typing` — payload `{ userId }`
   - Show typing indicator for 3 seconds, then auto-hide
3. Broadcast event `read` — payload `{ userId }`
   - Update read receipts on sent messages

**Publishing:**
- `sendTyping()`: broadcast `typing` event, throttled to once per 2 seconds
- `sendRead()`: broadcast `read` event immediately after marking messages as read

---

## CONSTANTS

```swift
struct ConnectLimits {
    static let maxMediaSlots = 6
    static let minMediaSlots = 1
    static let maxPrompts = 3
    static let minPrompts = 1
    static let headlineMax = 200
    static let lookingForMax = 500
    static let bioMax = 500
    static let promptAnswerMax = 500
    static let customPromptQuestionMax = 150
    static let matchNoteMax = 255
    static let messageMax = 1000
    static let discoveryBatchSize = 10
    static let messagesPageSize = 30
    static let matchesPageSize = 20
    static let likesPageSize = 20
    static let historyPageSize = 20
    static let maxFileSizeImage = 10_485_760    // 10MB
    static let maxFileSizeVideo = 52_428_800    // 50MB
    static let maxFileSizeAudio = 20_971_520    // 20MB
    static let maxFileSizeModel = 52_428_800    // 50MB
    static let maxFileSizeChatImage = 5_242_880 // 5MB
}

let connectPrompts = [
    "My most creative project was...",
    "I'm looking to collaborate on...",
    "A skill I want to learn is...",
    "My dream creative project would be...",
    "The medium I'm most passionate about is...",
    "I get inspired by...",
    "My creative process usually starts with...",
    "A project I'm most proud of is...",
    "I believe great design/art should...",
    "Something surprising about my work is...",
    "The best feedback I ever received was...",
    "I'm currently working on...",
    "My creative superpower is...",
    "I want to connect with people who...",
    "A tool I can't live without is...",
]
```

---

## DESIGN SYSTEM

### Colors (Light mode):
- Primary: `#0080FF` (bright blue, hsl 211 100% 50%)
- Primary Foreground: dark text on primary
- Background: white
- Card/Glass: white at 60% opacity + backdrop blur
- Muted Foreground: gray for secondary text
- Destructive: red `hsl(0, 84%, 60%)`
- Border: light gray

### Colors (Dark mode):
- Background: `hsl(220, 13%, 13%)` (dark charcoal)
- Card/Glass: dark at 40% opacity + backdrop blur
- Primary: same blue
- Text: white

### Glass Morphism:
- Background: `background.opacity(0.6)`
- Backdrop blur: `.ultraThinMaterial` or custom blur
- Border: `white.opacity(0.1)` (1pt)
- Corner radius: 16pt (cards), 12pt (buttons), full (avatars)

### Typography:
- Headings: System font, semibold/bold
- Body: System font, regular
- Small/Captions: System font, 12-13pt

### Safe Areas:
- Respect top safe area (notch/Dynamic Island)
- Respect bottom safe area (home indicator)
- Header height: 44pt (standard iOS nav bar)
- Tab bar height: 49pt (standard iOS tab bar)

---

## GEOLOCATION

### Usage:
1. Settings → "Use my location" button
2. Request `CLLocationManager` permission (whenInUse)
3. Get coordinates
4. Reverse geocode to city name via `https://nominatim.openstreetmap.org/reverse?lat=X&lon=Y&format=json&zoom=10`
5. Save coordinates + city to ConnectProfile via `connectProfile.update({ location, latitude, longitude })`
6. Enables distance-based discovery filtering

### Distance calculation (server-side, for reference):
- Haversine formula with Earth radius = 3959 miles
- Bounding box pre-filter, then exact Haversine post-filter

---

## IAP (RevenueCat)

### Products:
- INFINITE tier subscription

### Flow:
1. User taps upgrade
2. RevenueCat purchase flow
3. On success: call `connectProfile.upgradeTier({ tier: "INFINITE" })`
4. RevenueCat webhook on backend handles grant/revoke events

---

## AUTHENTICATION FLOW SUMMARY

```
App Launch
├── Check Supabase session
├── If no session → Login screen
├── If session exists:
│   ├── Check if user has DOB → if not → Complete Profile
│   ├── Check if user has ConnectProfile → if not → Profile Setup
│   └── If all complete → Discover (main tab)
```

### OAuth Flow (Google):
1. Open SFSafariViewController with Supabase OAuth URL
2. Callback redirects to app's URL scheme
3. Exchange code for session
4. Check user status → route accordingly

### OAuth Flow (Apple):
1. Use ASAuthorizationController (native Apple Sign In)
2. Get identity token
3. Call `supabase.auth.signInWithIdToken(provider: .apple, idToken: token)`
4. Check user status → route accordingly

---

## KEY IMPLEMENTATION NOTES

1. **Cursor-based pagination everywhere** — use `nextCursor` pattern, not offset-based
2. **Optimistic updates** — update UI immediately on swipe/message, rollback on error
3. **Image caching** — use Kingfisher or similar for efficient network image loading
4. **Haptic feedback** — on swipe actions (light impact), on match (heavy impact)
5. **Keyboard avoidance** — chat input must stay above keyboard
6. **Pull to refresh** — on Discover, Likes, Matches screens
7. **Skeleton loading** — show placeholder shapes while data loads
8. **Toast notifications** — non-blocking success/error messages (similar to Sonner)
9. **Deep linking** — handle `ekkoconnect://` URL scheme for OAuth callbacks and push notification taps
10. **3D card effect** — The swipe cards have a subtle 3D tilt/perspective effect on hover/drag. In Swift, implement via `rotation3DEffect` based on drag offset.
11. **Match normalization** — When creating matches, always sort user IDs alphabetically so `user1Id < user2Id`
12. **Content moderation** — The API runs content through `assertCleanContent()` which may reject inappropriate text

Build this as a production-quality iOS app with smooth animations, proper error handling, and offline resilience. Match the existing feature set exactly.
