// src/app/api/courses/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeMetrics } from "@/lib/metrics";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const department = searchParams.get("dept") || "";
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const courses = await prisma.course.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { courseCode: { contains: query, mode: "insensitive" } },
                  { title: { contains: query, mode: "insensitive" } },
                ],
              }
            : {},
          department
            ? { department: { code: { equals: department, mode: "insensitive" } } }
            : {},
        ],
      },
      include: {
        department: true,
        offerings: {
          include: {
            reports: true,
          },
        },
      },
      take: limit,
      orderBy: { courseCode: "asc" },
    });

    const result = courses.map((course) => {
      const allReports = course.offerings.flatMap((o) => o.reports);
      const metrics = computeMetrics(allReports);
      return {
        id: course.id,
        courseCode: course.courseCode,
        title: course.title,
        description: course.description,
        credits: course.credits,
        department: course.department,
        metrics,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
