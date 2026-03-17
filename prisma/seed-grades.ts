// prisma/seed-grades.ts
// Run: npx ts-node prisma/seed-grades.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = "https://planetterp.com/api/v1";
const DELAY = 300;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch { return null; }
}

type PTGrade = {
  course: string;
  professor: string | null;
  semester: string;
  section: string;
  "A+"?: number; A?: number; "A-"?: number;
  "B+"?: number; B?: number; "B-"?: number;
  "C+"?: number; C?: number; "C-"?: number;
  "D+"?: number; D?: number; "D-"?: number;
  F?: number; W?: number; Other?: number;
};

function getCount(g: PTGrade, key: string): number {
  return (g as unknown as Record<string, number>)[key] ?? 0;
}

function parseGPA(g: PTGrade): number | null {
  const gradePoints: [string, number][] = [
    ["A+",4.0],["A",4.0],["A-",3.7],
    ["B+",3.3],["B",3.0],["B-",2.7],
    ["C+",2.3],["C",2.0],["C-",1.7],
    ["D+",1.3],["D",1.0],["D-",0.7],
    ["F",0.0],
  ];
  let totalPoints = 0, totalStudents = 0;
  for (const [grade, points] of gradePoints) {
    const count = getCount(g, grade);
    totalPoints += count * points;
    totalStudents += count;
  }
  if (totalStudents === 0) return null;
  return Math.round((totalPoints / totalStudents) * 100) / 100;
}

function parseSemester(code: string): { semester: string; year: number } | null {
  if (code.length !== 6) return null;
  const year = parseInt(code.slice(0, 4));
  const month = parseInt(code.slice(4, 6));
  let semester = "FALL";
  if (month === 1) semester = "WINTER";
  else if (month <= 5) semester = "SPRING";
  else if (month <= 8) semester = "SUMMER";
  else semester = "FALL";
  return { semester, year };
}

async function main() {
  console.log("🐢 TerpSuccess — PlanetTerp Grade Seeder\n");

  const ourCourses = await prisma.course.findMany({ select: { id: true, courseCode: true } });
  console.log(`Found ${ourCourses.length} courses\n`);

  let added = 0, skipped = 0;

  for (let i = 0; i < ourCourses.length; i++) {
    const course = ourCourses[i];
    if (i % 100 === 0) process.stdout.write(`Progress: ${i}/${ourCourses.length}\r`);

    const grades = await fetchJSON<PTGrade[]>(`${BASE}/grades?course=${encodeURIComponent(course.courseCode)}`);
    if (!grades || grades.length === 0) { await sleep(DELAY); continue; }

    for (const g of grades) {
      try {
        const semInfo = parseSemester(g.semester);
        if (!semInfo) continue;

        const gpa = parseGPA(g);
        if (gpa === null) continue;

        const totalStudents =
          getCount(g,"A+") + getCount(g,"A") + getCount(g,"A-") +
          getCount(g,"B+") + getCount(g,"B") + getCount(g,"B-") +
          getCount(g,"C+") + getCount(g,"C") + getCount(g,"C-") +
          getCount(g,"D+") + getCount(g,"D") + getCount(g,"D-") +
          getCount(g,"F");

        if (totalStudents < 3 || !g.professor) continue;

        let professor = await prisma.professor.findFirst({ where: { fullName: { equals: g.professor, mode: "insensitive" } } });
        if (!professor) professor = await prisma.professor.create({ data: { fullName: g.professor } });

        let offering = await prisma.courseOffering.findFirst({
          where: { courseId: course.id, professorId: professor.id, semester: semInfo.semester as "FALL"|"SPRING"|"SUMMER"|"WINTER", year: semInfo.year },
        });
        if (!offering) {
          offering = await prisma.courseOffering.create({
            data: { courseId: course.id, professorId: professor.id, semester: semInfo.semester as "FALL"|"SPRING"|"SUMMER"|"WINTER", year: semInfo.year },
          });
        }

        const existing = await prisma.gradeDistribution.findFirst({ where: { offeringId: offering.id } });
        if (!existing) {
          await prisma.gradeDistribution.create({
            data: {
              offeringId: offering.id,
              courseId: course.id,
              avgGpa: gpa,
              totalStudents,
              aPlus: getCount(g,"A+"), a: getCount(g,"A"), aMinus: getCount(g,"A-"),
              bPlus: getCount(g,"B+"), b: getCount(g,"B"), bMinus: getCount(g,"B-"),
              cPlus: getCount(g,"C+"), c: getCount(g,"C"), cMinus: getCount(g,"C-"),
              dPlus: getCount(g,"D+"), d: getCount(g,"D"), dMinus: getCount(g,"D-"),
              f: getCount(g,"F"), w: getCount(g,"W"),
              source: "PLANETTERP",
            },
          });
          added++;
        } else { skipped++; }
      } catch { skipped++; }
    }
    await sleep(DELAY);
  }

  console.log(`\n\n🎉 Done! Added: ${added}, Skipped: ${skipped}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
