# TerpSuccess 🐢
### UMD Course Intelligence Platform

> Real data from UMD students — midterm averages, weekly workload, assignment counts, and survival tips.

---

## What This Is

TerpSuccess is a course intelligence platform for UMD students that answers the question PlanetTerp doesn't:

**"How hard is this class *actually*?"**

Students can see:
- Average midterm scores
- Weekly workload hours
- Assignment counts
- Difficulty ratings (1–10)
- Anonymous survival tips from past students

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 + Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth (later) | Supabase Auth or Clerk |
| Hosting | Vercel |

---

## Project Structure

```
terpdata/
├── prisma/
│   ├── schema.prisma        # Full database schema
│   └── seed.ts              # Seed departments + courses
├── src/
│   ├── app/
│   │   ├── page.tsx         # Homepage with search
│   │   ├── browse/          # Browse + filter courses
│   │   ├── course/[code]/   # Individual course page
│   │   ├── submit/          # Submit a course report
│   │   └── api/
│   │       ├── courses/     # GET courses with search/filter
│   │       ├── professors/  # GET professors
│   │       └── reports/     # POST submit, PATCH approve/reject
│   ├── lib/
│   │   ├── prisma.ts        # Prisma singleton
│   │   └── metrics.ts       # Compute averages + validate reports
│   └── types/
│       └── index.ts         # Shared TypeScript types
```

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo>
cd terpdata
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Copy your **database connection string** from Project Settings → Database
3. Create a `.env.local` file:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"
```

### 3. Push the database schema

```bash
npx prisma generate
npx prisma db push
```

### 4. Seed initial data

```bash
npm run db:seed
```

This adds:
- 7 departments (CMSC, ENEE, MATH, STAT, PHYS, BMGT, ECON)
- 18 core UMD courses

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with search |
| `/browse` | Filter courses by dept, difficulty, workload |
| `/course/[code]` | Course page with metrics + tips |
| `/professor/[id]` | Professor page (to be built) |
| `/submit` | Submit a course report form |

---

## API Routes

### `GET /api/courses`
Search and filter courses.

Query params:
- `q` — search query (course code or title)
- `dept` — department code filter (e.g. `CMSC`)
- `limit` — number of results (default 20)

### `GET /api/professors`
Search professors.

Query params:
- `q` — name search

### `POST /api/reports`
Submit a course report.

Body:
```json
{
  "courseCode": "CMSC351",
  "professorName": "Justin Wyss-Gallifent",
  "semester": "FALL",
  "year": 2024,
  "overallDifficulty": 8,
  "weeklyWorkloadHours": 12,
  "assignmentCount": 5,
  "midtermCount": 2,
  "midtermAverage": 64,
  "midtermDifficulty": 8,
  "classType": "EXAM_HEAVY",
  "tipText": "Start projects early. Midterm 1 is brutal."
}
```

### `PATCH /api/reports`
Approve or reject a report (admin only).

Body:
```json
{
  "reportId": "...",
  "status": "APPROVED"
}
```

---

## Database Schema (Overview)

```
users           → student accounts
departments     → CMSC, ENEE, MATH, etc.
courses         → CMSC351, ENEE245, etc.
professors      → professor records
course_offerings → course + professor + semester
reports         → student-submitted data (PENDING → APPROVED)
```

Reports go through a **moderation queue** before being displayed. This prevents bad data from polluting metrics.

---

## Team Roles

| Role | Responsibilities |
|------|-----------------|
| **You (Product Lead)** | Priorities, campus rollout, org outreach |
| **Tech Lead** | Database, API routes, deployment |
| **Frontend Lead** | UI pages, search, UX polish |
| **Growth Lead** | Org partnerships, social, ambassador program |
| **Data Lead** | Seed reports, moderation, data quality |

---

## Roadmap

### Phase 1 — MVP (Now)
- [x] Homepage with search
- [x] Course pages with metrics
- [x] Submit report form
- [x] Browse + filter
- [x] Database schema + seed data
- [ ] Professor pages
- [ ] Admin moderation panel
- [ ] Deploy to Vercel + Supabase

### Phase 2 — Traction
- [ ] UMD email verification (auth)
- [ ] Semester-specific data breakdowns
- [ ] Compare professors for same course
- [ ] Upvote helpful tips
- [ ] "Submit to unlock" mechanic

### Phase 3 — Growth
- [ ] GPA predictor
- [ ] AI schedule builder ("Build My Semester")
- [ ] Syllabus upload + parsing
- [ ] Expand to other universities

---

## Deployment

### Vercel (Frontend + API)
```bash
npm install -g vercel
vercel
```

Add your `DATABASE_URL` to Vercel environment variables.

### Supabase (Database)
Your Supabase project stays live on the free tier. No extra steps needed.

---

## First Milestones

| Milestone | Target |
|-----------|--------|
| 50 approved reports | Week 1–2 (seed from org network) |
| 250 weekly active students | Month 1 |
| 500+ reports | Month 2 |
| 20 courses with solid data | Month 1–2 |

---

## Adding More Courses

Edit `prisma/seed.ts` and add entries to the `courses` array, then re-run:

```bash
npm run db:seed
```

Or add courses directly via Prisma Studio:

```bash
npm run db:studio
```

---

Built by Terps, for Terps. 🐢
