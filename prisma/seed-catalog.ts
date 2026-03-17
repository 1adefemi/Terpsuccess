import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const BASE = "https://api.umd.io/v1";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} – ${url}`);
  return res.json() as Promise<T>;
}

async function fetchAllPages<T>(endpoint: string, perPage = 100): Promise<T[]> {
  let page = 1;
  const all: T[] = [];
  while (true) {
    const items = await fetchJSON<T[]>(`${BASE}${endpoint}?page=${page}&per_page=${perPage}`);
    if (!items || items.length === 0) break;
    all.push(...items);
    if (items.length < perPage) break;
    page++;
    await new Promise(r => setTimeout(r, 150));
  }
  return all;
}

type UMDCourse = { course_id: string; name: string; dept_id: string; department: string; credits: string; description?: string };
type UMDProfessor = { name: string; departments: string[]; courses: string[] };

async function main() {
  console.log("🐢 TerpSuccess Catalog Seeder");

  console.log("📚 Fetching courses...");
  const courses = await fetchAllPages<UMDCourse>("/courses");
  console.log(`   Found ${courses.length} courses`);

  const deptMap = new Map<string, string>();
  for (const c of courses) {
    if (c.dept_id && c.department) deptMap.set(c.dept_id, c.department);
  }

  console.log(`🏛  Seeding ${deptMap.size} departments...`);
  for (const [code, name] of Array.from(deptMap.entries())) {
    await prisma.department.upsert({ where: { code }, update: { name }, create: { code, name } });
  }

  console.log(`📖 Seeding ${courses.length} courses...`);
  let count = 0;
  for (const c of courses) {
    if (!c.course_id || !c.dept_id) continue;
    const dept = await prisma.department.findUnique({ where: { code: c.dept_id } });
    if (!dept) continue;
    const credits = c.credits ? parseInt(c.credits) : null;
    await prisma.course.upsert({
      where: { courseCode: c.course_id },
      update: { title: c.name || c.course_id, description: c.description || null, credits: isNaN(credits!) ? null : credits },
      create: { courseCode: c.course_id, title: c.name || c.course_id, description: c.description || null, credits: isNaN(credits!) ? null : credits, departmentId: dept.id },
    });
    count++;
    if (count % 100 === 0) process.stdout.write(`   ${count}/${courses.length}\r`);
  }
  console.log(`\n   ✅ Seeded ${count} courses`);

  console.log("👩‍🏫 Fetching professors...");
  const professors = await fetchAllPages<UMDProfessor>("/professors");
  console.log(`   Found ${professors.length} professors`);
  let profCount = 0;
  for (const p of professors) {
    if (!p.name) continue;
    const existing = await prisma.professor.findFirst({ where: { fullName: p.name } });
    if (!existing) { await prisma.professor.create({ data: { fullName: p.name } }); }
    profCount++;
  }
  console.log(`   ✅ Seeded ${profCount} professors`);

  const totalCourses = await prisma.course.count();
  const totalDepts = await prisma.department.count();
  const totalProfs = await prisma.professor.count();
  console.log("\n🎉 Catalog seeding complete!");
  console.log(`   Departments: ${totalDepts}`);
  console.log(`   Courses:     ${totalCourses}`);
  console.log(`   Professors:  ${totalProfs}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
