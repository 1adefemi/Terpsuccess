// prisma/seed.ts
// Run: npx ts-node prisma/seed.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const departments = [
  { code: "CMSC", name: "Computer Science" },
  { code: "ENEE", name: "Electrical & Computer Engineering" },
  { code: "MATH", name: "Mathematics" },
  { code: "STAT", name: "Statistics" },
  { code: "PHYS", name: "Physics" },
  { code: "BMGT", name: "Business Management" },
  { code: "ECON", name: "Economics" },
];

const courses = [
  { code: "CMSC131", title: "Object-Oriented Programming I", dept: "CMSC", credits: 4 },
  { code: "CMSC132", title: "Object-Oriented Programming II", dept: "CMSC", credits: 4 },
  { code: "CMSC216", title: "Introduction to Computer Systems", dept: "CMSC", credits: 4 },
  { code: "CMSC250", title: "Discrete Structures", dept: "CMSC", credits: 4 },
  { code: "CMSC330", title: "Organization of Programming Languages", dept: "CMSC", credits: 3 },
  { code: "CMSC351", title: "Algorithms", dept: "CMSC", credits: 3 },
  { code: "CMSC411", title: "Computer Systems Architecture", dept: "CMSC", credits: 3 },
  { code: "CMSC420", title: "Advanced Data Structures", dept: "CMSC", credits: 3 },
  { code: "ENEE244", title: "Digital Logic Design", dept: "ENEE", credits: 3 },
  { code: "ENEE245", title: "Circuits", dept: "ENEE", credits: 3 },
  { code: "ENEE303", title: "Analog & Digital Electronics", dept: "ENEE", credits: 3 },
  { code: "ENEE322", title: "Signal & System Theory", dept: "ENEE", credits: 3 },
  { code: "MATH140", title: "Calculus I", dept: "MATH", credits: 4 },
  { code: "MATH141", title: "Calculus II", dept: "MATH", credits: 4 },
  { code: "MATH241", title: "Calculus III", dept: "MATH", credits: 4 },
  { code: "MATH246", title: "Differential Equations", dept: "MATH", credits: 3 },
  { code: "STAT400", title: "Applied Probability & Statistics I", dept: "STAT", credits: 3 },
  { code: "STAT401", title: "Applied Probability & Statistics II", dept: "STAT", credits: 3 },
];

async function main() {
  console.log("Seeding departments...");
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }

  console.log("Seeding courses...");
  for (const course of courses) {
    const dept = await prisma.department.findUnique({ where: { code: course.dept } });
    if (!dept) continue;

    await prisma.course.upsert({
      where: { courseCode: course.code },
      update: {},
      create: {
        courseCode: course.code,
        title: course.title,
        credits: course.credits,
        departmentId: dept.id,
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log(`  ${departments.length} departments`);
  console.log(`  ${courses.length} courses`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
