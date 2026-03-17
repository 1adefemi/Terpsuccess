import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateReport } from "@/lib/metrics";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseCode, professorName, semester, year, overallDifficulty, weeklyWorkloadHours,
      assignmentCount, midtermCount, midtermAverage, midtermDifficulty,
      finalAverage, finalDifficulty,
      projectCount, projectDifficulty, labCount, labDifficulty,
      hwCount, hwDifficulty, quizCount, quizDifficulty,
      classType, tipText, professorRating, professorComment } = body;

    const validationError = validateReport({ overallDifficulty, weeklyWorkloadHours, assignmentCount: assignmentCount || 0, midtermCount: midtermCount || 0 });
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const course = await prisma.course.findUnique({ where: { courseCode: courseCode.toUpperCase() } });
    if (!course) return NextResponse.json({ error: "Course not found. Please check the course code." }, { status: 404 });

    let professor = await prisma.professor.findFirst({ where: { fullName: { equals: professorName, mode: "insensitive" } } });
    if (!professor) professor = await prisma.professor.create({ data: { fullName: professorName } });

    let offering = await prisma.courseOffering.findFirst({ where: { courseId: course.id, professorId: professor.id, semester, year: parseInt(year) } });
    if (!offering) offering = await prisma.courseOffering.create({ data: { courseId: course.id, professorId: professor.id, semester, year: parseInt(year) } });

    await prisma.report.create({
      data: {
        offeringId: offering.id,
        overallDifficulty: parseInt(overallDifficulty),
        weeklyWorkloadHours: parseFloat(weeklyWorkloadHours),
        assignmentCount: parseInt(assignmentCount) || 0,
        midtermCount: parseInt(midtermCount) || 0,
        midtermAverage: midtermAverage ? parseFloat(midtermAverage) : null,
        midtermDifficulty: midtermDifficulty ? parseInt(midtermDifficulty) : null,
        finalAverage: finalAverage ? parseFloat(finalAverage) : null,
        finalDifficulty: finalDifficulty ? parseInt(finalDifficulty) : null,
        projectCount: parseInt(projectCount) || 0,
        projectDifficulty: projectDifficulty ? parseInt(projectDifficulty) : null,
        labCount: parseInt(labCount) || 0,
        labDifficulty: labDifficulty ? parseInt(labDifficulty) : null,
        hwCount: parseInt(hwCount) || 0,
        hwDifficulty: hwDifficulty ? parseInt(hwDifficulty) : null,
        quizCount: parseInt(quizCount) || 0,
        quizDifficulty: quizDifficulty ? parseInt(quizDifficulty) : null,
        classType: classType || "BALANCED",
        tipText: tipText || null,
        status: "PENDING",
      },
    });

    if (professorRating && professorRating > 0) {
      await prisma.professorReview.create({
        data: { professorId: professor.id, courseCode: courseCode.toUpperCase(), rating: parseInt(professorRating), comment: professorComment || null, semester, year: parseInt(year), status: "PENDING" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { reportId, status, type } = await req.json();
    if (!["APPROVED","REJECTED"].includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    if (type === "review") await prisma.professorReview.update({ where: { id: reportId }, data: { status } });
    else await prisma.report.update({ where: { id: reportId }, data: { status } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
