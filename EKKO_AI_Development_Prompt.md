# EKKO Technical Specification for AI Development
## Complete Prompt for Building the MVP with AI Assistance

---

## Overview

**Project Name:** EKKO  
**Description:** The LinkedIn for Creatives - A professional platform connecting creatives with hiring opportunities  
**MVP Timeline:** 4 months  
**Target Users:** 5,000 beta users at launch

---

## Core Value Proposition

EKKO is a creator-first professional platform where:
- **Creatives** showcase portfolios, connect with opportunities, and get hired
- **Clients** discover vetted creative talent and manage projects end-to-end

**Key Differentiator:** First platform to combine ALL creative disciplines (design, music, video, writing, etc.) with built-in portfolio showcase, project management, escrow payments, and licensing.

---

## MVP Feature Requirements

### P0 (Must-Have for Launch)

#### 1. User Authentication & Onboarding
```
Features:
- Email/password registration and login
- OAuth: Google, Apple sign-in
- Role selection: Creative or Client
- Email verification
- Password reset flow
- Session management with JWT

Technical Specs:
- JWT access tokens (15 min expiry)
- Refresh tokens (7 days expiry)
- Secure password hashing (bcrypt, cost 12)
- Rate limiting: 5 attempts per 15 min
```

#### 2. User Profiles
```
Creative Profile Fields:
- Display name (required)
- Avatar image
- Bio/headline (280 chars)
- Location (city, country)
- Disciplines (multi-select: Design, Music, Video, Writing, etc.)
- Skills (tags with proficiency levels)
- Hourly rate range
- Availability status
- Portfolio pieces (3-5 minimum for MVP)
- Social links (website, Instagram, LinkedIn)
- Verification status badge

Client Profile Fields:
- Company/individual name
- Logo/avatar
- Company description
- Industry
- Location
- Website
- Hiring needs/tags

Portfolio Piece Fields:
- Title
- Description
- Media (images, video embed, audio embed)
- Category/tags
- Date created
- Client/project name (optional)
```

#### 3. Content Feed
```
Features:
- Algorithmic feed (engagement-based)
- Chronological option
- Post creation:
  - Text (500 chars max)
  - Images (up to 10, max 10MB each)
  - Video embed (YouTube, Vimeo)
  - Audio embed (SoundCloud)
- Engagement: Like, comment, save
- Post editing (within 24 hours)
- Post deletion

Feed Algorithm (MVP Simple):
- 40% from followed users
- 40% from same discipline
- 20% trending/tagged content
```

#### 4. Search & Discovery
```
Search Filters:
- Keyword (name, bio, skills)
- Discipline (dropdown)
- Location (city, remote)
- Availability (available now, this week, this month)
- Hourly rate range
- Verification status
- Skills (tag-based)

Results Display:
- Grid view (creative cards)
- Card info: Avatar, name, discipline, location, rate, verification badge
- Sort by: Relevance, newest, rating
- Pagination: 20 results per page
```

#### 5. Messaging
```
Features:
- Real-time direct messaging (1-on-1)
- Message history
- Read receipts
- Typing indicators
- File attachments (images, PDFs up to 25MB)
- Conversation list with previews
- Block/report user

Technical Specs:
- WebSocket for real-time
- Message persistence (PostgreSQL)
- Unread message count
- Push notifications (email fallback)
```

#### 6. Project Posting (Clients)
```
Project Fields:
- Title (required)
- Description (required, 2000 chars)
- Discipline needed
- Skills required (tags)
- Budget type: Fixed or Hourly
- Budget range (min/max)
- Duration estimate
- Location preference (remote/on-site/hybrid)
- Deadline
- Attachments (briefs, references)

Project Statuses:
- Draft
- Open (accepting applications)
- In Review (evaluating candidates)
- Assigned (creative selected)
- In Progress
- Completed
- Cancelled
```

#### 7. Project Applications (Creatives)
```
Application Fields:
- Cover message (500 chars)
- Proposed rate
- Estimated timeline
- Portfolio pieces to highlight
- Attachments (relevant work samples)

Application Statuses:
- Pending
- Viewed
- Shortlisted
- Accepted
- Declined
```

#### 8. Basic Payments (Stripe Connect)
```
Features:
- Stripe Connect Express onboarding
- Client payment method storage
- Escrow hold on project start
- Milestone-based releases
- Payouts to creatives
- Transaction history

Payment Flow:
1. Client adds payment method
2. On project start, funds held in escrow
3. Creative delivers work
4. Client approves, funds released
5. Stripe transfers to creative (minus 10% fee)

Fees:
- Platform fee: 10%
- Stripe fees: 2.9% + $0.30 (passed to client)
```

### P1 (Post-MVP, Month 5-6)

- Verification tier system (Red/Black badges)
- Advanced analytics dashboard
- Portfolio templates
- Project templates
- Team accounts (for agencies)
- Calendar integration
- Video conferencing integration

### P2 (Future)

- Licensing management system
- Contract templates
- Time tracking
- Invoicing
- Dispute resolution
- Mobile apps (iOS/Android)
- API for integrations

---

## Technical Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile Web  │  │   Admin      │      │
│  │  (Next.js)   │  │  (Responsive)│  │   Panel      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API LAYER                            │
│                    (Node.js + Express)                       │
│  - REST API for CRUD operations                             │
│  - GraphQL for complex queries (optional)                   │
│  - WebSocket server for real-time messaging                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL   │  │    Redis     │  │Elasticsearch │      │
│  │  (Primary)   │  │   (Cache)    │  │   (Search)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  AWS S3      │  │   Stripe     │                        │
│  │  (Storage)   │  │  (Payments)  │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

**Frontend:**
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui
- State: Zustand
- Data Fetching: React Query (TanStack Query)
- Forms: React Hook Form + Zod
- Real-time: Socket.io-client

**Backend:**
- Runtime: Node.js 20+
- Framework: Express.js
- Language: TypeScript
- Auth: Passport.js + JWT
- Validation: Zod
- Real-time: Socket.io

**Database:**
- Primary: PostgreSQL 15+
- ORM: Prisma
- Cache: Redis 7+
- Search: Elasticsearch 8+ (or Algolia for MVP simplicity)

**Storage & CDN:**
- Files: AWS S3
- CDN: CloudFront
- Images: Imgix or Cloudinary (for optimization)

**Payments:**
- Stripe Connect Express
- Stripe Webhooks

**Infrastructure:**
- Hosting: AWS ECS or Vercel
- Database: AWS RDS
- Cache: AWS ElastiCache
- CI/CD: GitHub Actions
- Monitoring: Datadog or Sentry

### Database Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String?   @map("password_hash")
  role          UserRole
  status        UserStatus @default(ACTIVE)
  emailVerified Boolean   @default(false) @map("email_verified")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  // Relations
  profile       Profile?
  posts         Post[]
  sentMessages     Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
  projects      Project[] @relation("ClientProjects")
  applications  Application[]
  portfolioItems PortfolioItem[]
  
  @@map("users")
}

model Profile {
  id                String   @id @default(uuid())
  userId            String   @unique @map("user_id")
  displayName       String   @map("display_name")
  bio               String?
  avatarUrl         String?  @map("avatar_url")
  location          String?
  website           String?
  hourlyRateMin     Int?     @map("hourly_rate_min")
  hourlyRateMax     Int?     @map("hourly_rate_max")
  availability      AvailabilityStatus @default(AVAILABLE)
  verificationStatus VerificationStatus @default(NONE) @map("verification_status")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  
  // Relations
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  skills            ProfileSkill[]
  disciplines       ProfileDiscipline[]
  
  @@map("profiles")
}

model Skill {
  id          String   @id @default(uuid())
  name        String   @unique
  category    String
  createdAt   DateTime @default(now()) @map("created_at")
  
  // Relations
  profiles    ProfileSkill[]
  
  @@map("skills")
}

model ProfileSkill {
  profileId   String   @map("profile_id")
  skillId     String   @map("skill_id")
  proficiency Int      // 1-5
  
  profile     Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  skill       Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)
  
  @@id([profileId, skillId])
  @@map("profile_skills")
}

model Discipline {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?
  iconUrl     String?  @map("icon_url")
  
  // Relations
  profiles    ProfileDiscipline[]
  projects    Project[]
  
  @@map("disciplines")
}

model ProfileDiscipline {
  profileId     String     @map("profile_id")
  disciplineId  String     @map("discipline_id")
  
  profile       Profile    @relation(fields: [profileId], references: [id], onDelete: Cascade)
  discipline    Discipline @relation(fields: [disciplineId], references: [id], onDelete: Cascade)
  
  @@id([profileId, disciplineId])
  @@map("profile_disciplines")
}

model PortfolioItem {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  title       String
  description String?
  mediaUrls   String[] @map("media_urls")
  category    String?
  tags        String[]
  createdAt   DateTime @default(now()) @map("created_at")
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("portfolio_items")
}

model Post {
  id            String    @id @default(uuid())
  userId        String    @map("user_id")
  content       String?
  mediaUrls     String[]  @map("media_urls")
  mediaType     MediaType @default(IMAGE) @map("media_type")
  likesCount    Int       @default(0) @map("likes_count")
  commentsCount Int       @default(0) @map("comments_count")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  // Relations
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  likes         Like[]
  comments      Comment[]
  
  @@map("posts")
}

model Like {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")
  userId    String   @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")
  
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  @@unique([postId, userId])
  @@map("likes")
}

model Comment {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")
  userId    String   @map("user_id")
  content   String
  createdAt DateTime @default(now()) @map("created_at")
  
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  @@map("comments")
}

model Project {
  id              String        @id @default(uuid())
  clientId        String        @map("client_id")
  title           String
  description     String
  budgetType      BudgetType    @map("budget_type")
  budgetMin       Int?          @map("budget_min")
  budgetMax       Int?          @map("budget_max")
  duration        String?
  locationType    LocationType  @map("location_type")
  location        String?
  deadline        DateTime?
  status          ProjectStatus @default(DRAFT)
  attachments     String[]
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  
  // Relations
  client          User          @relation("ClientProjects", fields: [clientId], references: [id], onDelete: Cascade)
  discipline      Discipline?   @relation(fields: [disciplineId], references: [id])
  disciplineId    String?       @map("discipline_id")
  applications    Application[]
  
  @@map("projects")
}

model Application {
  id          String              @id @default(uuid())
  projectId   String              @map("project_id")
  creativeId  String              @map("creative_id")
  coverLetter String              @map("cover_letter")
  proposedRate Int?               @map("proposed_rate")
  timeline    String?
  status      ApplicationStatus   @default(PENDING)
  createdAt   DateTime            @default(now()) @map("created_at")
  
  // Relations
  project     Project             @relation(fields: [projectId], references: [id], onDelete: Cascade)
  creative    User                @relation(fields: [creativeId], references: [id], onDelete: Cascade)
  
  @@map("applications")
}

model Conversation {
  id            String    @id @default(uuid())
  participant1Id String   @map("participant_1_id")
  participant2Id String   @map("participant_2_id")
  lastMessageAt DateTime? @map("last_message_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  
  // Relations
  messages      Message[]
  
  @@unique([participant1Id, participant2Id])
  @@map("conversations")
}

model Message {
  id              String        @id @default(uuid())
  conversationId  String        @map("conversation_id")
  senderId        String        @map("sender_id")
  content         String
  attachments     String[]
  readAt          DateTime?     @map("read_at")
  createdAt       DateTime      @default(now()) @map("created_at")
  
  // Relations
  conversation    Conversation  @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  @@map("messages")
}

// Enums
enum UserRole {
  CREATIVE
  CLIENT
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

enum AvailabilityStatus {
  AVAILABLE
  BUSY
  NOT_AVAILABLE
}

enum VerificationStatus {
  NONE
  EMAIL_VERIFIED
  RED_BADGE
  BLACK_BADGE
  PLATINUM
}

enum MediaType {
  TEXT
  IMAGE
  VIDEO
  AUDIO
}

enum BudgetType {
  FIXED
  HOURLY
}

enum LocationType {
  REMOTE
  ONSITE
  HYBRID
}

enum ProjectStatus {
  DRAFT
  OPEN
  IN_REVIEW
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ApplicationStatus {
  PENDING
  VIEWED
  SHORTLISTED
  ACCEPTED
  DECLINED
}
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/oauth/google
GET    /api/auth/oauth/google/callback
GET    /api/auth/oauth/apple
GET    /api/auth/oauth/apple/callback
```

### Users
```
GET    /api/users/me
PUT    /api/users/me
DELETE /api/users/me
GET    /api/users/:id
GET    /api/users/:id/portfolio
GET    /api/users/:id/posts
```

### Profiles
```
GET    /api/profiles/me
PUT    /api/profiles/me
POST   /api/profiles/me/avatar
DELETE /api/profiles/me/avatar
POST   /api/profiles/me/portfolio
PUT    /api/profiles/me/portfolio/:id
DELETE /api/profiles/me/portfolio/:id
GET    /api/profiles/search
GET    /api/profiles/directory
```

### Posts
```
GET    /api/feed
GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
PUT    /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/like
DELETE /api/posts/:id/like
POST   /api/posts/:id/comment
DELETE /api/posts/:id/comment/:commentId
```

### Projects
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/apply
GET    /api/projects/:id/applications
PUT    /api/projects/:id/applications/:applicationId
```

### Messages
```
GET    /api/conversations
POST   /api/conversations
GET    /api/conversations/:id/messages
POST   /api/conversations/:id/messages
PUT    /api/conversations/:id/read
```

### Payments (Stripe)
```
POST   /api/payments/connect/onboard
GET    /api/payments/connect/status
POST   /api/payments/intent
POST   /api/payments/confirm
GET    /api/payments/history
```

---

## Frontend Components

### Page Structure

```
app/
├── (auth)/
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   └── reset-password/
├── (main)/
│   ├── layout.tsx (with navbar, sidebar)
│   ├── page.tsx (feed)
│   ├── discover/
│   ├── messages/
│   ├── projects/
│   └── profile/
├── api/
└── layout.tsx
```

### Key Components

**Layout Components:**
- `Navbar` - Logo, search, notifications, user menu
- `Sidebar` - Navigation links, create post button
- `BottomNav` - Mobile navigation

**Feed Components:**
- `PostCard` - User info, content, media, engagement buttons
- `CreatePost` - Text input, media upload
- `FeedFilter` - Algorithmic/Chronological toggle

**Profile Components:**
- `ProfileHeader` - Avatar, name, bio, stats
- `PortfolioGrid` - Gallery of work
- `SkillsList` - Tags with proficiency
- `EditProfileModal` - Form for editing profile

**Project Components:**
- `ProjectCard` - Title, description, budget, status
- `ProjectForm` - Create/edit project
- `ApplicationModal` - Apply to project
- `ApplicationList` - Review applications

**Messaging Components:**
- `ConversationList` - Sidebar with chat previews
- `ChatWindow` - Messages, input, attachments
- `MessageBubble` - Individual message

**Search Components:**
- `SearchBar` - Input with filters
- `FilterPanel` - Discipline, location, rate filters
- `SearchResults` - Grid of profile cards

---

## UI/UX Design System

### Colors
```css
:root {
  --primary: #1A365D;      /* Deep Navy */
  --secondary: #4A5C6A;    /* Slate Blue */
  --accent: #E07A5F;       /* Warm Coral */
  --neutral: #8D99AE;      /* Soft Gray */
  --background: #EDF2F4;   /* Off-White */
  --dark: #1A1D21;         /* Charcoal */
  --text-light: #EDF2F4;
  --text-dark: #2B2D42;
}
```

### Typography
- **Headlines:** Hedvig Letters Sans, 600-700 weight
- **Body:** Quattrocento Sans, 400 weight
- **Scale:** 12px, 14px, 16px, 18px, 20px, 24px, 32px, 48px

### Spacing
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Components (shadcn/ui)
Install these shadcn components:
```bash
npx shadcn add button
npx shadcn add card
npx shadcn add input
npx shadcn add textarea
npx shadcn add select
npx shadcn add dialog
npx shadcn add dropdown-menu
npx shadcn add avatar
npx shadcn add badge
npx shadcn add tabs
npx shadcn add toast
npx shadcn add skeleton
n```

---

## Development Phases

### Phase 1: Foundation (Weeks 1-4)
- [ ] Project setup (Next.js, Tailwind, shadcn)
- [ ] Database setup with Prisma
- [ ] Authentication system
- [ ] Basic profile creation
- [ ] File upload (S3)

### Phase 2: Content & Discovery (Weeks 5-8)
- [ ] Feed with posts
- [ ] Post creation (text, images)
- [ ] Like, comment functionality
- [ ] Search with filters
- [ ] Profile discovery

### Phase 3: Projects & Messaging (Weeks 9-12)
- [ ] Project posting
- [ ] Project applications
- [ ] Real-time messaging
- [ ] Notification system

### Phase 4: Payments & Polish (Weeks 13-16)
- [ ] Stripe Connect integration
- [ ] Escrow workflow
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Beta launch prep

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ekko"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""

# AWS
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
AWS_S3_BUCKET="ekko-uploads"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_CONNECT_CLIENT_ID="ca_..."

# Redis
REDIS_URL="redis://localhost:6379"

# Elasticsearch
ELASTICSEARCH_URL="http://localhost:9200"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

---

## Testing Strategy

**Unit Tests:**
- Jest for logic functions
- React Testing Library for components
- Target: 70%+ coverage

**Integration Tests:**
- API endpoint testing with supertest
- Database integration tests

**E2E Tests:**
- Playwright for critical flows
- Login, profile creation, posting, messaging

---

## Deployment

**Development:**
```bash
# Local
npm run dev

# With Docker
docker-compose up
```

**Production:**
- Platform: Vercel (frontend) + AWS ECS (backend)
- Database: AWS RDS PostgreSQL
- Cache: AWS ElastiCache Redis
- Storage: AWS S3 + CloudFront

---

## Success Metrics

**Technical:**
- Page load < 2s
- API response < 200ms (p95)
- 99.9% uptime
- Zero critical security issues

**Product:**
- 5,000 beta users
- 30% monthly active
- 50+ projects posted
- 100+ successful connections

---

## Additional Resources

**Design Files:**
- Figma: [Link to design system]
- Brand Assets: [Link to logos, colors]

**Documentation:**
- API Docs: [Link to Swagger/OpenAPI]
- User Guide: [Link to help center]

**Third-Party Services:**
- Stripe Dashboard: [Link]
- AWS Console: [Link]
- Monitoring: [Link to Datadog/Sentry]

---

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in values
3. Run `npm install`
4. Run `npx prisma migrate dev`
5. Run `npm run dev`
6. Open http://localhost:3000

---

**Questions?** Contact: hello@ekko.app
