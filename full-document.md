# Learn Together — Technical Specification & Architecture Document

| Document | Version | Status |
|----------|---------|--------|
| Learn Together TSD | 1.0 | Production-oriented MVP |
| Last updated | 2026-10-13 | Aligned with `main` codebase |

**Hosted links**

| Role | URL |
|------|-----|
| Source code | [github.com/mohammadtaha-jami/learn-together](https://github.com/mohammadtaha-jami/learn-together) |
| Deploy / logs / env | [vercel.com/mohammadtaha-jami/learn-together](https://vercel.com/taha-2551/learn-together) |
| Production app | [https://learn-together-taha-2551.vercel.app](https://learn-together-taha-2551.vercel.app) — set as `NEXTAUTH_URL` · [Deployments](https://vercel.com/taha-2551/learn-together/deployments) |
| Local dev | `http://localhost:3000` |

---

## 1. System Overview

### 1.1 Executive Summary

**Learn Together** is a bilingual (Persian RTL / English content) web application for **structured self- and team-based learning**. Learners organize material as **topics** (books or courses), decomposed into **chapters** and nested **sections**. Each user tracks **three-state progress** per leaf section (`NOT_STARTED`, `IN_PROGRESS`, `DONE`). Teams collaborate via **invite codes**; team topics are visible to all members with **aggregated progress** on dashboards and topic detail views. A **prompt builder** assembles AI tutoring session prompts from selected sections and stores history locally per user.

The system is implemented as a **Next.js 14 monolith** (App Router): React UI, Route Handlers (REST-style JSON API), Prisma ORM, and PostgreSQL. Authentication uses **NextAuth v5 (beta)** with **Credentials** provider and **JWT sessions**.

### 1.2 Domain & Stakeholders

| Stakeholder | Role | Primary needs |
|-------------|------|----------------|
| Individual learner | End user | Personal topics, daily reading list, streaks, history |
| Team member | End user | Shared team topics, compare progress with peers |
| Team owner | End user | Create team, share invite code |
| Operator / admin | DevOps | Deploy app + DB, run migrations and seed |
| Future integrator | API consumer | Stable JSON APIs behind session auth |

**Domain boundaries (in scope for MVP):**

- User registration and login (email + password).
- One active team membership per user (create **or** join; not both).
- CRUD for topics, chapters, sections (within access rules).
- Per-user progress on sections (upsert).
- Dashboard overview (stats, “today” suggestions, weekly chart, team rollup).
- Generated prompt persistence (client-built content, server-stored).

**Out of scope (MVP):**

- OAuth / SSO providers, email verification, password reset flows.
- Multi-team per user, fine-grained RBAC beyond OWNER/MEMBER.
- Real-time sync (WebSockets); optimistic UI only on client.
- Native mobile apps; responsive web only.

### 1.3 Technical Objectives

1. **Clarity of learning structure** — hierarchical sections with leaf-level progress and % completion based on leaves only.
2. **Low operational complexity** — single deployable unit, managed PostgreSQL (Neon/Vercel Postgres or Docker locally).
3. **Security baseline** — hashed passwords, JWT sessions, server-side authorization on every mutating API.
4. **RTL-first UX** — Vazirmatn, logical CSS, accessible status controls (icon + color + text).
5. **Extensibility** — Prisma schema and modular `src/lib/learning/*` services for future notifications, assignments, or external LMS sync.

### 1.4 System Requirements

| Layer | Technology | Version (pinned in repo) |
|-------|------------|-------------------------|
| Runtime | Node.js | 20.x LTS recommended |
| Framework | Next.js (App Router) | 14.2.35 |
| UI | React 18, Tailwind CSS 3.4, lucide-react, CVA | — |
| Data fetching (client) | TanStack React Query | 5.x |
| Charts | Recharts | 3.x |
| ORM | Prisma | 5.22 |
| Database | PostgreSQL | 15 (Docker image) |
| Auth | next-auth@beta, bcryptjs | 5.0.0-beta.32 |
| Language | TypeScript | 5.x |

**Non-functional targets (MVP):**

- **Availability:** depends on hosting (Vercel + managed Postgres typical).
- **Latency:** dashboard overview is aggregation-heavy; acceptable for small teams (&lt;20 users, &lt;5k leaf sections).
- **Locale:** `fa-IR` UI copy; book titles often English (`titleEn`) with optional `titleFa`.

---

## 2. Architecture & Design

### 2.1 Architectural Style

**Modular monolith** — one Next.js application containing:

- **Presentation:** Server Components + Client Components (`src/app`, `src/components`).
- **API layer:** Route Handlers under `src/app/api/**/route.ts`.
- **Domain / application services:** `src/lib/learning`, `src/lib/team`, `src/lib/prompts`.
- **Infrastructure:** `src/lib/prisma.ts`, `auth.ts`, `middleware.ts`.

There is **no separate BFF or microservice**; the browser talks to same-origin `/api/*` with session cookies.

### 2.2 High-Level Architecture

```mermaid
flowchart TB
  subgraph Client["Browser (RTL UI)"]
    Pages["App Router Pages\n/ /login /dashboard/*"]
    RQ["React Query"]
    Pages --> RQ
  end

  subgraph Next["Next.js 14 Server"]
    MW["Middleware\n/dashboard/* auth"]
    RSC["Server Components\nSiteHeader auth()"]
    API["Route Handlers\n/api/*"]
    Auth["NextAuth\n/api/auth/*"]
    Lib["Domain Libs\noverview, topic-access, section-tree"]
    MW --> Pages
    RSC --> Auth
    API --> Lib
    API --> Auth
    Auth --> Lib
  end

  subgraph Data["Data Tier"]
    PG[(PostgreSQL)]
    Prisma["Prisma Client"]
    Lib --> Prisma
    Auth --> Prisma
    Prisma --> PG
  end

  Client -->|HTTPS + cookies| Next
```

### 2.3 Request Flow — Progress Update (Sequence)

```mermaid
sequenceDiagram
  participant U as User
  participant UI as TopicDetailClient
  participant API as POST /api/progress
  participant ACC as topic-access
  participant DB as PostgreSQL

  U->>UI: Tap section row (cycle status)
  UI->>UI: Optimistic cache update (React Query)
  UI->>API: JSON { sectionId, status }
  API->>API: requireUser() session
  API->>DB: find Section + Chapter
  API->>ACC: getTopicIfAccessible(topicId, userId)
  alt Forbidden
    API-->>UI: 403 Forbidden
  else OK
    API->>DB: upsert Progress
    API-->>UI: 200 Progress row
    UI->>UI: invalidate overview / progress (debounced)
  end
```

### 2.4 Layer Responsibilities

| Layer | Responsibility | Key artifacts |
|-------|----------------|-----------------|
| UI | Marketing, auth forms, dashboard shell, topic tree, charts | `DashboardShell`, `TopicDetailClient`, `DashboardOverview` |
| API | HTTP validation, status codes, thin orchestration | `src/app/api/**` |
| Domain | Access control, tree algorithms, aggregations | `topic-access.ts`, `section-tree.ts`, `overview.ts` |
| Auth | Login, JWT, route protection | `auth.config.ts`, `auth.ts`, `middleware.ts` |
| Persistence | Schema, migrations, seed | `prisma/schema.prisma`, `prisma/migrations` |

### 2.5 Directory / Folder Structure

```
learn-together/
├── data/                          # Optional duplicate seed JSON (reference)
├── docker-compose.yml             # Local PostgreSQL 15
├── prisma/
│   ├── migrations/                # SQL migrations (init, align_spec_fields)
│   ├── schema.prisma              # Canonical data model
│   ├── seed.ts                    # db:seed entry (team + FSA book topic)
│   ├── seed-data/                 # book-seed-data.json
│   └── scripts/                   # setup-current-users-team, load-env, inspect
├── public/                        # (static assets via app/)
├── src/
│   ├── app/
│   │   ├── (auth)/                # login, register layouts
│   │   ├── api/                   # REST Route Handlers
│   │   │   ├── auth/              # register, [...nextauth]
│   │   │   ├── team/
│   │   │   ├── topics/
│   │   │   ├── chapters/
│   │   │   ├── sections/
│   │   │   ├── progress/
│   │   │   ├── dashboard/overview/
│   │   │   └── prompts/
│   │   ├── dashboard/             # Protected UI routes
│   │   ├── globals.css
│   │   ├── layout.tsx             # RTL root, ThemeProvider
│   │   ├── page.tsx               # Marketing home
│   │   └── providers.tsx          # SessionProvider + QueryClient
│   ├── auth.config.ts             # Edge-safe NextAuth config
│   ├── auth.ts                    # Credentials + Prisma (Node)
│   ├── components/
│   │   ├── auth/ layout/ dashboard/ learning/ prompts/ theme/ ui/
│   ├── lib/
│   │   ├── learning/              # overview, status, section-tree, topic-access
│   │   ├── prompts/               # master-prompt, build-session-prompt
│   │   ├── team/                  # invite code helpers
│   │   ├── prisma.ts
│   │   └── session.ts             # requireUser() for APIs
│   ├── middleware.ts
│   └── types/next-auth.d.ts
├── .env.example
├── package.json
├── tailwind.config.ts
└── full-document.md               # This document
```

### 2.6 Key Modules & Services

| Module | Path | Purpose |
|--------|------|---------|
| **Session guard** | `lib/session.ts` | `requireUser()` → 401 if no JWT user id |
| **Topic access** | `lib/learning/topic-access.ts` | PERSONAL owner check; TEAM membership check |
| **Section tree** | `lib/learning/section-tree.ts` | `buildSectionTree`, `getLeafSections`, prompt line formatting |
| **Overview aggregator** | `lib/learning/overview.ts` | `buildOverview`, `getTopicSummaries` for dashboard |
| **Status cycle** | `lib/learning/status.ts` | `NOT_STARTED` → `IN_PROGRESS` → `DONE` |
| **Team helpers** | `lib/team/helpers.ts` | Invite code generation, primary team lookup |
| **Prompt builder** | `lib/prompts/build-session-prompt.ts` | Assemble session text from chapter + sections |
| **UI primitives** | `components/ui/*` | Design system (Button, Card, StatusButton, ProgressRing) |

**Progress semantics:** Completion percentage and team comparisons use **leaf sections** only (nodes with no children). Parent rows show rolled-up child progress in the UI but are not themselves progress targets unless they are leaves.

---

## 3. Database & Data Modeling

### 3.1 Entity-Relationship Overview

```mermaid
erDiagram
  User ||--o{ TeamMember : joins
  Team ||--o{ TeamMember : has
  User ||--o{ Topic : owns
  Team ||--o{ Topic : "TEAM scope"
  Topic ||--o{ Chapter : contains
  Chapter ||--o{ Section : contains
  Section ||--o{ Section : "parentId tree"
  User ||--o{ Progress : tracks
  Section ||--o{ Progress : "per user"
  User ||--o{ GeneratedPrompt : saves
  Chapter ||--o{ GeneratedPrompt : context

  User {
    string id PK
    string email UK
    string passwordHash
    string name
  }
  Team {
    string id PK
    string inviteCode UK
  }
  Topic {
    string id PK
    enum scope
    string ownerId FK
    string teamId FK "nullable"
  }
  Progress {
    string userId FK
    string sectionId FK
    enum status
  }
```

### 3.2 Enumerations

| Enum | Values | Usage |
|------|--------|--------|
| `TopicScope` | `PERSONAL`, `TEAM` | Visibility and `teamId` requirement |
| `ProgressStatus` | `NOT_STARTED`, `IN_PROGRESS`, `DONE` | Per-user section state |
| `TeamRole` | `OWNER`, `MEMBER` | Team membership role |

### 3.3 Schema Tables

#### `User`

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | `String` | Primary key | `@id @default(cuid())` |
| `email` | `String` | Login identifier | `@unique`, normalized lowercase in register |
| `passwordHash` | `String` | bcrypt hash | Never exposed in API |
| `name` | `String` | Display name | Required |
| `avatarUrl` | `String?` | Optional avatar URL | Nullable |
| `createdAt` | `DateTime` | Audit | `@default(now())` |
| `updatedAt` | `DateTime` | Audit | `@updatedAt` |

#### `Team`

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | `String` | PK | cuid |
| `name` | `String` | Team display name | |
| `inviteCode` | `String` | Join code | `@unique`, 6-char A-Z2-9 |
| `createdAt` / `updatedAt` | `DateTime` | Audit | |

#### `TeamMember`

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | `String` | PK | |
| `userId` | `String` | FK → User | `onDelete: Cascade` |
| `teamId` | `String` | FK → Team | `onDelete: Cascade` |
| `role` | `TeamRole` | OWNER or MEMBER | Default `MEMBER` |
| `joinedAt` | `DateTime` | Membership start | |
| — | — | One row per user+team | `@@unique([userId, teamId])` |

**Business rule (app-level):** MVP allows **at most one** `TeamMember` row per user (enforced in `POST /api/team` and `POST /api/team/join`).

#### `Topic`

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | `String` | PK | |
| `scope` | `TopicScope` | PERSONAL or TEAM | Indexed |
| `titleEn` | `String` | Canonical title | Required |
| `titleFa` | `String?` | Persian title | Optional |
| `description` | `String?` | Long description | Optional |
| `ownerId` | `String` | Creator | FK User |
| `teamId` | `String?` | Required when `scope=TEAM` | FK Team, nullable |
| `createdAt` / `updatedAt` | `DateTime` | Audit | |

#### `Chapter`

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | `String` | PK | |
| `topicId` | `String` | FK Topic | Cascade delete |
| `number` | `String?` | e.g. `Ch.1` | |
| `titleEn` / `titleFa` | `String` / `String?` | Titles | `titleEn` required |
| `partLabel` | `String?` | Grouping (Part I, …) | UI groups by this |
| `sortOrder` | `Int` | Order within topic | Default 0 |

#### `Section`

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | `String` | PK | |
| `chapterId` | `String` | FK Chapter | |
| `parentId` | `String?` | Self-FK for tree | Nullable = root in chapter |
| `titleEn` / `titleFa` | `String` / `String?` | Node labels | |
| `sortOrder` | `Int` | Sibling order | |

#### `Progress`

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | `String` | PK | |
| `userId` | `String` | FK User | |
| `sectionId` | `String` | FK Section | |
| `status` | `ProgressStatus` | Default `NOT_STARTED` | |
| `note` | `String?` | Optional learner note | |
| `completedAt` | `DateTime?` | Set when `status=DONE` | Cleared otherwise |
| `updatedAt` | `DateTime` | Last change | Used in weekly stats |
| — | — | One progress per user+section | `@@unique([userId, sectionId])` |

#### `GeneratedPrompt`

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | `String` | PK | |
| `userId` | `String` | FK User | |
| `chapterId` | `String` | FK Chapter | |
| `sectionIds` | `String[]` | PostgreSQL array | Selected sections |
| `emphasis` | `String?` | User emphasis text | |
| `content` | `Text` | Full prompt body | Client-built, server stored |
| `createdAt` | `DateTime` | History ordering | Index `(userId, createdAt DESC)` |

### 3.4 Data Flow — Dashboard Overview

1. Load all topics accessible to user (personal + team topics for memberships).
2. For each topic, load chapters and sections; compute **leaf** section IDs per chapter.
3. Load user `Progress` rows for all leaf IDs; compute per-topic and global stats.
4. Build **today** list: per topic, up to 3 items — `IN_PROGRESS` first, then next `NOT_STARTED`.
5. Build **week** histogram from `Progress.completedAt` with client `tz` offset (`getTimezoneOffset()`).
6. If user has team, `groupBy` DONE counts on team topic leaves for member %.

---

## 4. API / Interface Reference

### 4.1 Conventions

| Aspect | Rule |
|--------|------|
| Base URL | Same origin as the app (`NEXTAUTH_URL` + `/api`), e.g. `https://<your-production-domain>.vercel.app/api` |
| Auth | Session cookie from NextAuth (except `POST /api/auth/register`) |
| Content-Type | `application/json` for bodies |
| Errors | `{ "error": "message" }` (Persian or English depending on route) |
| IDs | CUID strings |

### 4.2 HTTP Status Codes (global)

| Code | When |
|------|------|
| `200` | Successful GET/PATCH/DELETE (with body) |
| `201` | Resource created |
| `400` | Validation / business rule (e.g. already in team) |
| `401` | Missing or invalid session (`requireUser`) |
| `403` | Authenticated but no access to topic/section |
| `404` | Resource not found or inaccessible (masked as 404 for topics) |
| `409` | Register: email already exists |
| `500` | Unhandled server error |

### 4.3 Authentication

#### `POST /api/auth/register`

Public. Creates user with bcrypt cost factor **12**.

**Request:**

```json
{
  "name": "علی رضایی",
  "email": "user@example.com",
  "password": "secret12"
}
```

**Responses:**

- `200` — `{ "ok": true }`
- `400` — missing fields or password &lt; 6 chars
- `409` — email taken

#### NextAuth — `/api/auth/*`

Handled by `handlers` from `src/auth.ts` (Credentials provider). Client uses `signIn("credentials", { email, password })`. Session strategy: **JWT** with `session.user.id` populated via callbacks.

### 4.4 Team

#### `GET /api/team`

**Response `200`:**

```json
{
  "team": { "id": "...", "name": "تیم یادگیری", "inviteCode": "FSA26", "createdAt": "...", "updatedAt": "..." },
  "role": "OWNER"
}
```

`team` is `null` if user has no membership.

#### `POST /api/team`

**Request:** `{ "name": "تیم یادگیری" }` (optional name)

**Response `201`:** Team object with generated `inviteCode`.

**`400`:** User already in a team.

#### `POST /api/team/join`

**Request:** `{ "inviteCode": "FSA26" }` (normalized uppercase)

**Response `200`:** `{ "team": { ... } }`

**`404`:** Invalid code.

#### `GET /api/team/members`

**Response `200`:**

```json
{
  "team": { "id": "...", "name": "...", "inviteCode": "..." },
  "members": [
    { "id": "userId", "name": "...", "email": "...", "avatarUrl": null, "role": "OWNER", "joinedAt": "..." }
  ]
}
```

### 4.5 Topics

#### `GET /api/topics?scope=TEAM|PERSONAL` (scope optional)

**Response `200`:** Array of `TopicSummary`:

```json
[
  {
    "id": "clx...",
    "titleEn": "Fundamentals of Software Architecture",
    "titleFa": null,
    "description": null,
    "scope": "TEAM",
    "teamName": "تیم یادگیری",
    "chapterCount": 25,
    "total": 209,
    "done": 42,
    "inProgress": 5,
    "percent": 20
  }
]
```

#### `POST /api/topics`

**Request:**

```json
{
  "scope": "TEAM",
  "titleEn": "My Book",
  "titleFa": "کتاب من",
  "description": "optional",
  "teamId": "team-cuid"
}
```

**Response `201`:** Raw `Topic` Prisma object.

#### `GET /api/topics/:id`

**Response `200`:** Topic with nested `chapters[].sections[]` ordered by `sortOrder`.

#### `PATCH /api/topics/:id`

**Request:** Partial `{ titleEn, titleFa, description }`.

#### `DELETE /api/topics/:id`

**Response `200`:** `{ "ok": true }`

#### `POST /api/topics/:id/chapters`

**Request:**

```json
{
  "number": "Ch.1",
  "titleEn": "Introduction",
  "titleFa": "مقدمه",
  "partLabel": "Part I",
  "sortOrder": 0
}
```

### 4.6 Chapters & Sections

#### `PATCH /api/chapters/:id` / `DELETE /api/chapters/:id`

Update or remove chapter (cascade sections). Body on PATCH: chapter fields.

#### `POST /api/chapters/:id/sections`

**Request:**

```json
{
  "titleEn": "Architecture Characteristics",
  "titleFa": null,
  "parentId": null,
  "sortOrder": 0
}
```

#### `PATCH /api/sections/:id` / `DELETE /api/sections/:id`

Update or delete section node (cascade children per Prisma).

### 4.7 Progress

#### `GET /api/progress?topicId=:id`

**Response `200`:**

```json
{
  "progress": [
    { "id": "...", "userId": "...", "sectionId": "...", "status": "DONE", "note": null, "completedAt": "...", "updatedAt": "..." }
  ],
  "membersSummary": [
    { "userId": "...", "name": "...", "percent": 35 }
  ],
  "leafSectionIds": ["...", "..."]
}
```

#### `POST /api/progress`

**Request:**

```json
{
  "sectionId": "section-cuid",
  "status": "IN_PROGRESS",
  "note": "optional"
}
```

**Response `200`:** Upserted `Progress` row. `completedAt` set automatically when `status` is `DONE`.

### 4.8 Dashboard

#### `GET /api/dashboard/overview?tz=-210`

| Query | Description |
|-------|-------------|
| `tz` | `Date.getTimezoneOffset()` from browser (minutes); used for day boundaries |

**Response `200`:** `Overview` object (`stats`, `topics`, `today`, `week`, `team`). See `src/lib/learning/overview.ts` types.

**Sample (truncated):**

```json
{
  "stats": {
    "percent": 20,
    "total": 209,
    "done": 42,
    "inProgress": 5,
    "doneToday": 3,
    "streak": 2
  },
  "today": [
    {
      "sectionId": "...",
      "titleEn": "Measuring Architecture Characteristics",
      "topicId": "...",
      "chapterId": "...",
      "status": "IN_PROGRESS"
    }
  ],
  "week": [
    { "key": "2026-10-07", "label": "د", "count": 2, "isToday": false }
  ],
  "team": {
    "id": "...",
    "name": "تیم یادگیری",
    "inviteCode": "FSA26",
    "members": [{ "id": "...", "name": "...", "percent": 20, "isMe": true }]
  }
}
```

### 4.9 Prompts

#### `GET /api/prompts`

Last **30** prompts for current user with `chapter` summary.

#### `POST /api/prompts`

**Request:**

```json
{
  "chapterId": "...",
  "sectionIds": ["...", "..."],
  "emphasis": "بیشتر مثال بزن",
  "content": "full assembled prompt text"
}
```

**Response `201`:** `GeneratedPrompt` record.

### 4.10 UI Routes (non-API)

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Marketing home |
| `/login`, `/register` | Public | Auth forms (also linked from header) |
| `/dashboard` | Auth | Overview dashboard |
| `/dashboard/team`, `/personal` | Auth | Topic lists by scope |
| `/dashboard/topics/new` | Auth | Create topic |
| `/dashboard/topics/[id]` | Auth | Chapter/section progress UI |
| `/dashboard/prompts` | Auth | Prompt builder |
| `/dashboard/history` | Auth | Personal stats + chart |

Deep links: `/dashboard/topics/[id]?chapter=&section=` scrolls to section.

---

## 5. Configuration & Environment

### 5.1 Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5437/learn_together?schema=public` |
| `NEXTAUTH_URL` | **Yes** (prod) | Canonical app URL | `https://learn-together-taha-2551.vercel.app` |
| `NEXTAUTH_SECRET` | **Yes** (prod) | JWT/session signing secret | `openssl rand -base64 32` |
| `SEED_TEAM_INVITE_CODE` | Seed only | Invite code for seeded team | `FSA26` |
| `SEED_SECRET` | Optional | Guard seed HTTP routes in production | — |
| `NODE_ENV` | Auto | `development` / `production` | |

**Local Docker Postgres (from `docker-compose.yml`):**

- Host port: **5437** → container `5432`
- User / password / DB: `postgres` / `postgres` / `learn_together`

### 5.2 NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Local development |
| `build` | `prisma generate && next build` | Production build |
| `start` | `next start` | Run production server |
| `lint` | `next lint` | ESLint |
| `db:migrate` | `prisma migrate dev` | Dev migrations |
| `db:seed` | `prisma db seed` | Seed team + book |
| `db:setup-team` | `tsx prisma/scripts/setup-current-users-team.ts` | Attach real users to team/topic |

### 5.3 Production Options

| Concern | Recommended approach |
|---------|---------------------|
| Hosting | **Vercel** (Next.js native) or Node VM with `next start` |
| Database | **Neon**, **Vercel Postgres**, or RDS; require SSL in `DATABASE_URL` |
| Migrations | Run `npx prisma migrate deploy` in CI or release step |
| Secrets | Platform env vault; never commit `.env` |
| File storage | N/A (no uploads in MVP; `avatarUrl` is external URL only) |

---

## 6. Deployment & DevOps

### 6.1 Local Development Stack

```bash
cd learn-together
cp .env.example .env
docker compose up -d          # PostgreSQL on localhost:5437
npm install
npx prisma migrate dev
npm run db:seed
npm run dev                   # http://localhost:3000
```

### 6.2 Docker Usage (current repo)

The repository ships **Docker Compose for PostgreSQL only**. The Next.js app runs on the host (or a separate container not yet defined in repo).

**Optional production Dockerfile (recommended pattern, not yet in repo):**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
CMD ["node", "server.js"]
```

> Enable `output: 'standalone'` in `next.config.mjs` if adopting the Dockerfile above.

### 6.3 Vercel Deployment (documented in README)

| Item | Link |
|------|------|
| Vercel project | [vercel.com/mohammadtaha-jami/learn-together](https://vercel.com/taha-2551/learn-together) |
| Production deployments | [Deployments](https://vercel.com/taha-2551/learn-together/deployments) |
| Git repository | [github.com/mohammadtaha-jami/learn-together](https://github.com/mohammadtaha-jami/learn-together) |
| Clone template (Vercel) | [Import repository](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmohammadtaha-jami%2Flearn-together&project-name=learn-together) |

1. Connect the GitHub repository; confirm **Root Directory** matches where `package.json` lives.
2. Set env vars: `DATABASE_URL` (Neon pooled + `pgbouncer=true` for serverless), `NEXTAUTH_URL` (exact Production **Visit** URL), `NEXTAUTH_SECRET`, `SEED_TEAM_INVITE_CODE`.
3. Build command: `prisma generate && next build` (default from `package.json`).
4. Post-deploy: `npx prisma migrate deploy` against the production database (same Neon DB as `DATABASE_URL`).
5. One-time: `npm run db:seed` against production (or run seed from CI with protected secret).
6. Live URL: Vercel → **Deployments** → filter **Production** → **Visit**.

### 6.4 CI/CD Strategy (recommended)

No GitHub Actions workflow is committed yet. Recommended pipeline:

```mermaid
flowchart LR
  PR[Pull Request] --> Lint[eslint + tsc]
  Lint --> Test[optional: prisma validate]
  Merge[Merge to main] --> Migrate[prisma migrate deploy]
  Migrate --> Deploy[Vercel Production]
```

**Sample GitHub Actions jobs:**

| Job | Steps |
|-----|--------|
| `ci` | `npm ci` → `npx prisma validate` → `npx tsc --noEmit` → `npm run lint` |
| `deploy-db` | On release: `prisma migrate deploy` with production `DATABASE_URL` |
| `deploy-app` | Vercel Git integration or `vercel deploy --prod` |

### 6.5 Build & Release Checklist

- [ ] Rotate `NEXTAUTH_SECRET` per environment.
- [ ] Use connection pooling (e.g. Prisma + PgBouncer or Neon pooler) under serverless.
- [ ] Run migrations before serving new app revision.
- [ ] Verify `/api/dashboard/overview` latency with production data volume.
- [ ] Do not run `db:seed` repeatedly in production without idempotency review (`seed.ts` behavior).

---

## 7. Security & Error Handling

### 7.1 Authentication & Session Security

| Control | Implementation |
|---------|----------------|
| Password storage | bcrypt (`cost=12`) in `POST /api/auth/register` |
| Session | JWT via NextAuth v5; `trustHost: true` for Vercel |
| Route protection | `middleware.ts` matcher `/dashboard/:path*` + `authorized` callback |
| API authorization | Every handler calls `requireUser()`; topics via `getTopicIfAccessible` |
| Edge vs Node split | `auth.config.ts` edge-safe; `auth.ts` uses Prisma+bcrypt only on server routes |

**Threat notes:**

- Credentials provider is vulnerable to **credential stuffing** — rate limiting (WAF / middleware) recommended for production.
- No MFA or email verification in MVP.

### 7.2 Authorization Model

| Resource | Rule |
|----------|------|
| `PERSONAL` topic | `ownerId === userId` |
| `TEAM` topic | User is `TeamMember` of `topic.teamId` |
| Progress | User can only upsert **own** `userId`; section must belong to accessible topic |
| GeneratedPrompt | Scoped to `userId` on read/write |
| Team create/join | One team per user (application-enforced) |

### 7.3 Input Validation

- Register: required fields, password length ≥ 6, email lowercased.
- Topic scope: `validateTopicPayload` enforces `teamId` presence/absence.
- Section `parentId` must belong to same chapter.
- Progress: `sectionId` and `status` required; enum enforced by Prisma.
- JSON bodies parsed with optional chaining; malformed JSON may throw → 500 (wrap in try/catch where critical).

### 7.4 CORS & CSRF

- Same-origin SPA: browser calls `/api/*` on same host — **default same-site cookies**.
- NextAuth handles CSRF tokens for auth endpoints.
- No public third-party API exposure; CORS wide open is **not** required for MVP.

### 7.5 Transport & Headers

- Enforce **HTTPS** in production (`NEXTAUTH_URL` must be `https://`).
- Consider `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options` via Vercel headers or `next.config.mjs`.

### 7.6 Secrets & Data Protection

- `.env` gitignored; `.env.example` has placeholders only.
- `passwordHash` never returned in API responses.
- Database backups: operator responsibility (managed Postgres snapshots).

### 7.7 Error Handling Patterns

| Layer | Behavior |
|-------|----------|
| API routes | Return JSON `{ error }` with appropriate HTTP status |
| `requireUser` | Uniform `401 Unauthorized` |
| Access denied topic | `404` or `403` depending on route (topics often `404` to avoid leaking existence) |
| Client (React Query) | Empty states, skeletons; optimistic rollback on progress failure |
| Prisma | Uncaught errors → 500; register route catches and returns generic Persian message |

### 7.8 Troubleshooting / FAQ

| Symptom | Likely cause | Resolution |
|---------|--------------|------------|
| Prisma `P1012` | Missing `DATABASE_URL` | Copy `.env.example` → `.env` |
| Prisma `P1000` auth failed | Wrong host/port/credentials | Use `5437` for local Docker mapping |
| `EPERM` on `prisma generate` during build | Dev server locking files on Windows | Stop `npm run dev` before `npm run build` |
| Dashboard 401 | Session expired | Re-login at `/login` |
| Team book topic not visible | User created new team instead of joining seed | Join with `SEED_TEAM_INVITE_CODE` (`FSA26`) |
| Progress % mismatch | Parent section marked — only **leaves** count | Mark leaf nodes; parents show rollup UI only |
| Hydration warning on dates | `toLocaleString` SSR mismatch | `ClientDateTime` component used for history |
| Edge middleware warning with bcrypt | bcrypt only in `auth.ts`, not in middleware | Keep split config pattern |

### 7.9 Security Roadmap (post-MVP)

1. Rate limit `/api/auth/register` and NextAuth sign-in.
2. Email verification and password reset flows.
3. Role-based topic admin (only OWNER deletes team topics).
4. Audit log for progress changes.
5. Optional `SEED_SECRET` enforcement for all seed scripts in production.
6. Content Security Policy for XSS hardening on markdown/prompt previews.

---

## Appendix A — Technology Stack Summary (Input Mapping)

| Input category | Learn Together choice |
|----------------|----------------------|
| **Project name** | Learn Together |
| **Domain** | Team/personal learning tracker; books/chapters; progress; AI prompt helper |
| **Frontend** | Next.js 14 App Router, React 18, Tailwind, React Query, Recharts |
| **Backend** | Next.js Route Handlers (serverless/Node) |
| **Database** | PostgreSQL 15 + Prisma 5 |
| **DevOps** | Docker Compose (DB), Vercel-oriented docs; CI template recommended |
| **Architecture** | Modular monolith, JWT session auth, domain libs |

---

## Appendix B — Document Maintenance

Update this file when:

- Prisma schema or migrations change.
- New API routes or breaking response shapes are introduced.
- Auth provider or deployment target changes.
- Security controls (rate limits, CSP) are implemented.

**Owners:** Engineering lead / technical author.  
**Review cadence:** Each release tag or quarterly architecture review.
