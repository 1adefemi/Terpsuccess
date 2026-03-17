// src/app/api/professors/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeMetrics } from "@/lib/metrics";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  try {
    const professors = await prisma.professor.findMany({
      where: query
        ? { fullName: { contains: query, mode: "insensitive" } }
        : {},
      include: {
        offerings: {
          include: {
            course: { include: { department: true } },
            reports: true,
          },
        },
      },
      take: 20,
    });

    const result = professors.map((prof) => ({
      id: prof.id,
      fullName: prof.fullName,
      courses: prof.offerings.map((o) => ({
        courseCode: o.course.courseCode,
        courseTitle: o.course.title,
        semester: o.semester,
        year: o.year,
        metrics: computeMetrics(o.reports),
      })),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch professors" }, { status: 500 });
  }
}
