// prisma/seed-enrichment.ts
// Pulls gen-eds, prerequisites, and course descriptions from umd.io
// Run: npx ts-node prisma/seed-enrichment.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = "https://api.umd.io/v1";
const DELAY = 150;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch { return null; }
}

type UMDCourse = {
  course_id: string;
  name: string;
  credits: string;
  description?: string;
  gen_ed?: string[][];
  core?: string[];
  relationships?: {
    prereqs?: string | null;
    coreqs?: string | null;
    restrictions?: string | null;
  };
};

async function main() {
  console.log("🐢 TerpSuccess — Course Enrichment Seeder");
  console.log("Pulling gen-eds, prerequisites, descriptions from api.umd.io\n");

  const courses = await prisma.course.findMany({ select: { id: true, courseCode: true } });
  console.log(`Found ${courses.length} courses to enrich\n`);

  let updated = 0;

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    if (i % 100 === 0) process.stdout.write(`Progress: ${i}/${courses.length}\r`);

    const data = await fetchJSON<UMDCourse>(`${BASE}/courses/${course.courseCode}`);
    if (!data) { await sleep(DELAY); continue; }

    // Flatten gen-ed arrays e.g. [["FSAW"], ["DSHS", "DSSP"]] -> ["FSAW", "DSHS", "DSSP"]
    const genEd = data.gen_ed ? data.gen_ed.flat() : [];

    await prisma.course.update({
      where: { id: course.id },
      data: {
        description: data.description || undefined,
        genEd,
      },
    });

    // Store prereqs as a course topic if present
    if (data.relationships?.prereqs) {
      await prisma.coursePrereq.upsert({
        where: { courseId: course.id },
        update: { prereqs: data.relationships.prereqs, coreqs: data.relationships.coreqs || null, restrictions: data.relationships.restrictions || null },
        create: { courseId: course.id, prereqs: data.relationships.prereqs, coreqs: data.relationships.coreqs || null, restrictions: data.relationships.restrictions || null },
      });
    }

    updated++;
    await sleep(DELAY);
  }

  console.log(`\n\n🎉 Done! Enriched ${updated} courses`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
