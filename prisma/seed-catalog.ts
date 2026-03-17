// prisma/seed-catalog.ts
// Fetches ALL UMD courses and professors from the umd.io API
// and seeds them into your database.
//
// Run: npx ts-node prisma/seed-catalog.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = "https://api.umd.io/v1";

// ── helpers ──────────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} – ${url}`);
  return res.json() as Promise<T>;
}

async function fetchAllPages<T>(
  endpoint: string,
  perPage = 100
): Promise<T[]> {
  let page = 1;
  const all: T[] = [];

  while (true) {
    const url = `${BASE}${endpoint}?page=${page}&per_page=${perPage}`;
    const items = await fetchJSON<T[]>(url);
    if (!items || items.length === 0) break;
    all.push(...items);
    if (items.length < perPage) break;
    page++;
    // Be polite to the API
    await new Promise((r) => setTimeout(r, 150));
  }

  return all;
}

// ── types ─────────────────────────────────────────────────────────────────────

type UMDCourse = {
  course_id: string;       // e.g. "CMSC351"
  name: string;            // e.g. "Algorithms"
  dept_id: string;         // e.g. "CMSC"
  department: string;      // e.g. "Computer Science"
  credits: string;         // e.g. "3"
  description?: string;
  gen_ed?: string[];
};

type UMDProfessor = {
  name: string;
  departments: string[];
  courses: string[];
};

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🐢 TerpSuccess Catalog Seeder");
  console.log("Fetching UMD course data from api.umd.io...\n");

  // 1. Fetch all courses
  console.log("📚 Fetching courses...");
  const courses = await fetchAllPages<UMDCourse>("/courses");
  console.log(`   Found ${courses.length} courses\n`);

  // 2. Build unique departments from course data
  const deptMap = new Map<string, string>();
  for (const c of courses) {
    if (c.dept_id && c.department) {
      deptMap.set(c.dept_id, c.department);
    }
  }
  console.log(`🏛  Seeding ${deptMap.size} departments...`);
  for (const [code, name] of Array.from(deptMap.entries())) {
    await prisma.department.upsert({
      where: { code },
      update: { name },
      create: { code, name },
    });
  }
  console.log("   Done.\n");

  // 3. Seed courses
  console.log(`📖 Seeding ${courses.length} courses...`);
  let courseCount = 0;
  let skipped = 0;

  for (const c of courses) {
    if (!c.course_id || !c.dept_id) { skipped++; continue; }

    const dept = await prisma.department.findUnique({
      where: { code: c.dept_id },
    });
    if (!dept) { skipped++; continue; }

    const credits = c.credits ? parseInt(c.credits) : null;

    await prisma.course.upsert({
      where: { courseCode: c.course_id },
      update: {
        title: c.name || c.course_id,
        description: c.description || null,
        credits: isNaN(credits!) ? null : credits,
      },
      create: {
        courseCode: c.course_id,
        title: c.name || c.course_id,
        description: c.description || null,
        credits: isNaN(credits!) ? null : credits,
        departmentId: dept.id,
      },
    });

    courseCount++;
    if (courseCount % 100 === 0) {
      process.stdout.write(`   ${courseCount}/${courses.length} courses...\r`);
    }
  }
  console.log(`\n   ✅ Seeded ${courseCount} courses (${skipped} skipped)\n`);

  // 4. Fetch and seed professors
  console.log("👩‍🏫 Fetching professors...");
  const professors = await fetchAllPages<UMDProfessor>("/professors");
  console.log(`   Found ${professors.length} professor records`);

  let profCount = 0;
  for (const p of professors) {
    if (!p.name) continue;

    await prisma.professor.upsert({
      where: { id: p.name }, // We'll use name as a lookup key
      update: {},
      create: { fullName: p.name },
    }).catch(async () => {
      // If upsert by id fails, try by name
      const existing = await prisma.professor.findFirst({
        where: { fullName: p.name },
      });
      if (!existing) {
        await prisma.professor.create({ data: { fullName: p.name } });
      }
    });

    profCount++;
  }
  console.log(`   ✅ Seeded ${profCount} professors\n`);

  // 5. Summary
  const totalCourses = await prisma.course.count();
  const totalDepts = await prisma.department.count();
  const totalProfs = await prisma.professor.count();

  console.log("🎉 Catalog seeding complete!");
  console.log(`   Departments: ${totalDepts}`);
  console.log(`   Courses:     ${totalCourses}`);
  console.log(`   Professors:  ${totalProfs}`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
