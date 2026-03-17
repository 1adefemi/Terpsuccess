// src/app/api/reports/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateReport } from "@/lib/metrics";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      courseCode,
      professorName,
      semester,
      year,
      overallDifficulty,
      weeklyWorkloadHours,
      assignmentCount,
      midtermCount,
      midtermAverage,
      midtermDifficulty,
      classType,
      tipText,
    } = body;

    // Validate inputs
    const validationError = validateReport({
      overallDifficulty,
      weeklyWorkloadHours,
      assignmentCount,
      midtermCount,
      midtermDifficulty,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Look up the course
    const course = await prisma.course.findUnique({
      where: { courseCode: courseCode.toUpperCase() },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Find or create professor
    let professor = await prisma.professor.findFirst({
      where: { fullName: { equals: professorName, mode: "insensitive" } },
    });
    if (!professor) {
      professor = await prisma.professor.create({
        data: { fullName: professorName },
      });
    }

    // Find or create the course offering
    let offering = await prisma.courseOffering.findFirst({
      where: {
        courseId: course.id,
        professorId: professor.id,
        semester,
        year: parseInt(year),
      },
    });
    if (!offering) {
      offering = await prisma.courseOffering.create({
        data: {
          courseId: course.id,
          professorId: professor.id,
          semester,
          year: parseInt(year),
        },
      });
    }

    // Create the report (PENDING by default for moderation)
    const report = await prisma.report.create({
      data: {
        offeringId: offering.id,
        overallDifficulty: parseInt(overallDifficulty),
        weeklyWorkloadHours: parseFloat(weeklyWorkloadHours),
        assignmentCount: parseInt(assignmentCount),
        midtermCount: parseInt(midtermCount),
        midtermAverage: midtermAverage ? parseFloat(midtermAverage) : null,
        midtermDifficulty: midtermDifficulty ? parseInt(midtermDifficulty) : null,
        classType,
        tipText: tipText || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

// Admin: approve/reject a report
export async function PATCH(req: NextRequest) {
  try {
    const { reportId, status } = await req.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const report = await prisma.report.update({
      where: { id: reportId },
      data: { status },
    });

    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
