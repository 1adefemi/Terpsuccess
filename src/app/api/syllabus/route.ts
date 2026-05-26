import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      courseCode, professorName, semester, year,
      gradingBreakdown,
      cutoffA, cutoffB, cutoffC, cutoffD,
      hasCurve, curvePolicy,
      textbook, weeklyTopics,
      latePolicy, attendancePolicy, extraCreditPolicy,
    } = body;

    if (!courseCode || !professorName || !semester || !year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { courseCode: courseCode.toUpperCase() } });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    let professor = await prisma.professor.findFirst({ where: { fullName: { equals: professorName, mode: "insensitive" } } });
    if (!professor) professor = await prisma.professor.create({ data: { fullName: professorName } });

    let offering = await prisma.courseOffering.findFirst({
      where: { courseId: course.id, professorId: professor.id, semester, year: parseInt(year) },
    });
    if (!offering) {
      offering = await prisma.courseOffering.create({
        data: { courseId: course.id, professorId: professor.id, semester, year: parseInt(year) },
      });
    }

    // Upsert syllabus data
    await prisma.syllabusData.upsert({
      where: { offeringId: offering.id },
      update: {
        gradingBreakdown: gradingBreakdown || undefined,
        cutoffA: cutoffA ? parseFloat(cutoffA) : null,
        cutoffB: cutoffB ? parseFloat(cutoffB) : null,
        cutoffC: cutoffC ? parseFloat(cutoffC) : null,
        cutoffD: cutoffD ? parseFloat(cutoffD) : null,
        hasCurve: hasCurve || false,
        curvePolicy: curvePolicy || null,
        textbook: textbook || null,
        weeklyTopics: weeklyTopics || undefined,
        latePolicy: latePolicy || null,
        attendancePolicy: attendancePolicy || null,
        extraCreditPolicy: extraCreditPolicy || null,
        status: "PENDING",
      },
      create: {
        offeringId: offering.id,
        courseId: course.id,
        gradingBreakdown: gradingBreakdown || undefined,
        cutoffA: cutoffA ? parseFloat(cutoffA) : null,
        cutoffB: cutoffB ? parseFloat(cutoffB) : null,
        cutoffC: cutoffC ? parseFloat(cutoffC) : null,
        cutoffD: cutoffD ? parseFloat(cutoffD) : null,
        hasCurve: hasCurve || false,
        curvePolicy: curvePolicy || null,
        textbook: textbook || null,
        weeklyTopics: weeklyTopics || undefined,
        latePolicy: latePolicy || null,
        attendancePolicy: attendancePolicy || null,
        extraCreditPolicy: extraCreditPolicy || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to submit syllabus data" }, { status: 500 });
  }
}
