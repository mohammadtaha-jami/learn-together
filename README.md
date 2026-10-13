<!-- Banner: replace with your repo banner image -->
<!-- ![Learn Together](./docs/banner.png) -->

# Learn Together

[![Build](https://img.shields.io/github/actions/workflow/status/YOUR_ORG/learn-together/ci.yml?branch=main&label=build)](https://github.com/YOUR_ORG/learn-together/actions)
[![Version](https://img.shields.io/badge/version-0.1.0-blue)](./package.json)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)

**Team and personal learning tracker** — structure books into chapters and sections, track three-state progress, and study together with invite-code teams.

| | |
|---|---|
| **Developer** | [Your Name](https://github.com/YOUR_USERNAME) · [Team / Org](https://github.com/YOUR_ORG) |
| **Demo** | _Coming soon_ — `https://your-demo.vercel.app` |
| **Docs** | [Technical Specification](./full-document.md) |

---

## About The Project

Reading a technical book as a group is hard when nobody knows who read what, or what to tackle today. **Learn Together** turns a shared curriculum into a **checklist with clear status** (`not started` → `in progress` → `done`), rolls progress up by chapter and topic, and surfaces **today’s sections** and **weekly stats** on a Persian RTL dashboard.

**Core value:**

- One place for **team** and **personal** learning paths.
- **Leaf-level progress** so completion percentages stay honest.
- **AI session prompts** built from the sections you select (copy-ready, with history).

---

## Key Features

- **Authentication** — Email/password registration and NextAuth v5 (Credentials) with JWT sessions; `/dashboard` protected by middleware.
- **Teams** — Create a team or join via **invite code** (MVP: one team per user).
- **Topics** — `PERSONAL` or `TEAM` scope; bilingual titles (`titleEn` / `titleFa`).
- **Content model** — Chapters, nested sections (tree), optional `partLabel` grouping (e.g. book parts).
- **Progress** — Per-user upsert on sections; team **member %** on team topics (leaf sections only).
- **Dashboard** — Overview API: global stats, streak, 7-day chart, “today” reading list, topic cards.
- **Prompt builder** — Master prompt + session prompt from selected sections; save last 30 prompts per user.
- **UI** — RTL (Vazirmatn), dark/light theme, lucide icons, React Query with optimistic progress updates.
- **Seed data** — Optional seed for *Fundamentals of Software Architecture* and demo team (`FSA26`).

---

## Built With

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 20+ |
| **Framework** | [Next.js](https://nextjs.org/) 14.2 (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) 5 |
| **UI** | React 18, [Tailwind CSS](https://tailwindcss.com/) 3.4, [lucide-react](https://lucide.dev/), CVA |
| **Data fetching** | [TanStack React Query](https://tanstack.com/query) 5 |
| **Charts** | [Recharts](https://recharts.org/) 3 |
| **ORM** | [Prisma](https://www.prisma.io/) 5.22 |
| **Database** | [PostgreSQL](https://www.postgresql.org/) 15 |
| **Auth** | [NextAuth.js](https://authjs.dev/) 5 (beta), bcryptjs |
| **Local DB** | Docker Compose (`postgres:15-alpine`, host port **5437**) |

---

## Getting Started

### Prerequisites

- **Node.js** 20.x LTS (or 18.18+)
- **npm** 9+ (or pnpm/yarn with equivalent scripts)
- **Docker** & Docker Compose (recommended for local PostgreSQL)
- **Git**

### Installation

```bash
git clone https://github.com/YOUR_ORG/learn-together.git
cd learn-together

cp .env.example .env

docker compose up -d

npm install
npx prisma migrate dev    # first-time schema; use `migrate deploy` in CI/production
npm run db:seed             # demo team + FSA book topic (invite code from SEED_TEAM_INVITE_CODE)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Optional** — attach existing DB users to the seeded team/topic:

```bash
npm run db:setup-team
```

### Environment setup

Create `.env` from the example:

```env
# Local Docker (port 5437 on host)
DATABASE_URL="postgresql://postgres:postgres@localhost:5437/learn_together?schema=public"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Seeded team invite (default FSA26)
SEED_TEAM_INVITE_CODE="FSA26"

# Optional: protect seed routes in production
# SEED_SECRET=""
```

Generate a secret:

```bash
openssl rand -base64 32
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes (prod) | Canonical app URL |
| `NEXTAUTH_SECRET` | Yes (prod) | Session/JWT signing secret |
| `SEED_TEAM_INVITE_CODE` | Seed | Invite code for seeded team |
| `SEED_SECRET` | No | Optional production guard for seed |

---

## Usage Examples

### Development

```bash
npm run dev          # http://localhost:3000
npm run lint         # ESLint
npx tsc --noEmit     # typecheck without production build
```

### Production build

```bash
npm run build
npm run start
```

> On Windows, stop `npm run dev` before `npm run build` if Prisma `generate` hits file lock (`EPERM`).

### First team lesson (seeded book)

1. Run `npm run db:seed`.
2. **Register** at `/register`.
3. Go to **Team learning** (`/dashboard/team`) and **join** with `SEED_TEAM_INVITE_CODE` (default `FSA26`).  
   _Creating a new team instead of joining hides the seeded book topic._
4. Open the book topic, expand chapters, tap sections to cycle progress.

### API (authenticated)

Session cookie required after login. Example progress update:

```bash
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -b "your-session-cookie" \
  -d '{"sectionId":"SECTION_CUID","status":"IN_PROGRESS"}'
```

Dashboard overview (pass browser timezone offset):

```bash
curl "http://localhost:3000/api/dashboard/overview?tz=-210" -b "your-session-cookie"
```

See [full-document.md](./full-document.md) for the complete API reference.

### Deploy (Vercel + managed Postgres)

1. Set env: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `SEED_TEAM_INVITE_CODE`.
2. Build: `prisma generate && next build` (default in `package.json`).
3. After deploy: `npx prisma migrate deploy` and run `npm run db:seed` once on production DB if you want demo data.

---

## Demo / Screenshots

| Screen | Link |
|--------|------|
| Home | _Add screenshot: `./docs/screenshots/home.png`_ |
| Dashboard | _Add screenshot: `./docs/screenshots/dashboard.png`_ |
| Topic detail | _Add screenshot: `./docs/screenshots/topic.png`_ |
| Live demo | _https://your-demo.vercel.app_ |

---

## Project structure (high level)

```
src/app/          # App Router pages + /api route handlers
src/components/   # UI, dashboard, learning, layout
src/lib/          # Prisma, auth helpers, learning domain logic
prisma/           # Schema, migrations, seed
```

---

## Contributing

Contributions are welcome. Please:

1. Fork the repository and create a feature branch (`feat/short-description`).
2. Keep changes focused; run `npm run lint` and `npx tsc --noEmit`.
3. Open a Pull Request with a clear description and test notes.

For large changes, open an issue first to align on scope.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for the full text.

If `LICENSE` is not yet in the repo, add:

```text
MIT License — Copyright (c) 2026 [Your Name]
```

---

<p align="center">
  Built for daily, structured learning — alone or together.
</p>
