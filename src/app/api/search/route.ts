import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  if (!query || query.length < 2) return NextResponse.json({ courses: [], professors: [] });
  try {
    const [courses, professors] = await Promise.all([
      prisma.course.findMany({
        where: { OR: [{ courseCode: { contains: query, mode: "insensitive" } }, { title: { contains: query, mode: "insensitive" } }] },
        include: { department: true },
        orderBy: { courseCode: "asc" },
        take: 6,
      }),
      prisma.professor.findMany({
        where: { fullName: { contains: query, mode: "insensitive" } },
        orderBy: { fullName: "asc" },
        take: 4,
      }),
    ]);
    return NextResponse.json({
      courses: courses.map(c => ({ id: c.id, courseCode: c.courseCode, title: c.title, deptCode: c.department.code })),
      professors: professors.map(p => ({ id: p.id, fullName: p.fullName })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ courses: [], professors: [] });
  }
}
