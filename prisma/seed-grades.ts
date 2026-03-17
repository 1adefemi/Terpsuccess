// prisma/seed-grades.ts
// Pulls grade distributions from PlanetTerp API and seeds into database
// Run: npx ts-node prisma/seed-grades.ts
// PlanetTerp API is public and free to use: https://planetterp.com/api/

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = "https://planetterp.com/api/v1";
const DELAY = 300; // ms between requests — be polite to their API

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

type PTGrade = {
  course: string;
  professor: string | null;
  semester: string; // e.g. "202308" = Fall 2023
  section: string;
  "A+"?: number; A?: number; "A-"?: number;
  "B+"?: number; B?: number; "B-"?: number;
  "C+"?: number; C?: number; "C-"?: number;
  "D+"?: number; D?: number; "D-"?: number;
  F?: number; W?: number; Other?: number;
};

type PTCourse = {
  name: string;
  title: string;
  credits: number;
  description: string;
  professors: string[];
};

function parseGPA(grades: PTGrade): number | null {
  const gradePoints: Record<string, number> = {
    "A+": 4.0, "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D+": 1.3, "D": 1.0, "D-": 0.7,
    "F": 0.0,
  };

  let totalPoints = 0;
  let totalStudents = 0;

  for (const [grade, points] of Object.entries(gradePoints)) {
    const count = (grades as Record<string, number>)[grade] || 0;
    totalPoints += count * points;
    totalStudents += count;
  }

  if (totalStudents === 0) return null;
  return Math.round((totalPoints / totalStudents) * 100) / 100;
}

function parseSemester(semesterCode: string): { semester: string; year: number } | null {
  // PlanetTerp format: "202308" = year 2023, month 08 = Fall
  // months: 01=Winter, 05=Spring, 08=Summer, 12=Fall  (approximately)
  if (semesterCode.length !== 6) return null;
  const year = parseInt(semesterCode.slice(0, 4));
  const month = parseInt(semesterCode.slice(4, 6));
  let semester = "FALL";
  if (month === 1) semester = "WINTER";
  else if (month <= 5) semester = "SPRING";
  else if (month <= 8) semester = "SUMMER";
  else semester = "FALL";
  return { semester, year };
}

async function main() {
  console.log("🐢 TerpSuccess — PlanetTerp Grade Seeder");
  console.log("Fetching grade data from planetterp.com/api/v1\n");
  console.log("Note: No authentication required. Please be respectful of their API.\n");

  // Get all our courses from the database
  const ourCourses = await prisma.course.findMany({
    select: { id: true, courseCode: true },
  });
  console.log(`📚 Found ${ourCourses.length} courses in our database\n`);

  let gradeRecordsAdded = 0;
  let coursesUpdated = 0;
  let errors = 0;

  for (let i = 0; i < ourCourses.length; i++) {
    const course = ourCourses[i];

    if (i % 50 === 0) {
      console.log(`Progress: ${i}/${ourCourses.length} courses processed...`);
    }

    // Fetch grades for this course from PlanetTerp
    const grades = await fetchJSON<PTGrade[]>(
      `${BASE}/grades?course=${encodeURIComponent(course.courseCode)}`
    );

    if (!grades || grades.length === 0) {
      await sleep(DELAY);
      continue;
    }

    // Group grades by professor + semester
    for (const gradeRecord of grades) {
      try {
        const semesterInfo = parseSemester(gradeRecord.semester);
        if (!semesterInfo) continue;

        const gpa = parseGPA(gradeRecord);
        if (gpa === null) continue;

        const totalStudents =
          (gradeRecord["A+"] || 0) + (gradeRecord["A"] || 0) + (gradeRecord["A-"] || 0) +
          (gradeRecord["B+"] || 0) + (gradeRecord["B"] || 0) + (gradeRecord["B-"] || 0) +
          (gradeRecord["C+"] || 0) + (gradeRecord["C"] || 0) + (gradeRecord["C-"] || 0) +
          (gradeRecord["D+"] || 0) + (gradeRecord["D"] || 0) + (gradeRecord["D-"] || 0) +
          (gradeRecord["F"] || 0);

        if (totalStudents < 3) continue; // skip tiny sections

        // Find or create professor
        let professorId: string | null = null;
        if (gradeRecord.professor) {
          let professor = await prisma.professor.findFirst({
            where: { fullName: { equals: gradeRecord.professor, mode: "insensitive" } },
          });
          if (!professor) {
            professor = await prisma.professor.create({ data: { fullName: gradeRecord.professor } });
          }
          professorId = professor.id;
        }

        if (!professorId) continue;

        // Find or create course offering
        let offering = await prisma.courseOffering.findFirst({
          where: {
            courseId: course.id,
            professorId,
            semester: semesterInfo.semester as "FALL" | "SPRING" | "SUMMER" | "WINTER",
            year: semesterInfo.year,
          },
        });
        if (!offering) {
          offering = await prisma.courseOffering.create({
            data: {
              courseId: course.id,
              professorId,
              semester: semesterInfo.semester as "FALL" | "SPRING" | "SUMMER" | "WINTER",
              year: semesterInfo.year,
            },
          });
        }

        // Store grade distribution as an approved report
        // We create a synthetic "grade report" from PlanetTerp data
        const existing = await prisma.gradeDistribution.findFirst({
          where: { offeringId: offering.id },
        });

        if (!existing) {
          await prisma.gradeDistribution.create({
            data: {
              offeringId: offering.id,
              avgGpa: gpa,
              totalStudents,
              aPlus: gradeRecord["A+"] || 0,
              a: gradeRecord["A"] || 0,
              aMinus: gradeRecord["A-"] || 0,
              bPlus: gradeRecord["B+"] || 0,
              b: gradeRecord["B"] || 0,
              bMinus: gradeRecord["B-"] || 0,
              cPlus: gradeRecord["C+"] || 0,
              c: gradeRecord["C"] || 0,
              cMinus: gradeRecord["C-"] || 0,
              dPlus: gradeRecord["D+"] || 0,
              d: gradeRecord["D"] || 0,
              dMinus: gradeRecord["D-"] || 0,
              f: gradeRecord["F"] || 0,
              w: gradeRecord["W"] || 0,
              source: "PLANETTERP",
            },
          });
          gradeRecordsAdded++;
        }

        coursesUpdated++;
      } catch (err) {
        errors++;
      }
    }

    await sleep(DELAY);
  }

  console.log("\n🎉 Grade seeding complete!");
  console.log(`   Grade distributions added: ${gradeRecordsAdded}`);
  console.log(`   Courses with data: ${coursesUpdated}`);
  console.log(`   Errors skipped: ${errors}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
