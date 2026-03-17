import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeMetrics } from "@/lib/metrics";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  try {
    const professors = await prisma.professor.findMany({
      where: query ? { fullName: { contains: query, mode: "insensitive" } } : {},
      include: {
        offerings: {
          include: { course: { include: { department: true } }, reports: true },
        },
        reviews: { where: { status: "APPROVED" } },
      },
      orderBy: { fullName: "asc" },
      take: query ? 10 : 2000, // when searching show top 10, when loading all show everyone
    });

    const result = professors.map(prof => {
      const allReports = prof.offerings.flatMap(o => o.reports);
      const metrics = computeMetrics(allReports);
      const avgRating = prof.reviews.length > 0
        ? prof.reviews.reduce((a, b) => a + b.rating, 0) / prof.reviews.length
        : null;
      return {
        id: prof.id,
        fullName: prof.fullName,
        avgRating,
        reviewCount: prof.reviews.length,
        metrics,
        courses: prof.offerings.map(o => ({ courseCode: o.course.courseCode, courseTitle: o.course.title })),
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch professors" }, { status: 500 });
  }
}
