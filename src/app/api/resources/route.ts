import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseCode = searchParams.get("course") || "";
  const topic = searchParams.get("topic") || "";

  try {
    const course = await prisma.course.findUnique({ where: { courseCode: courseCode.toUpperCase() } });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const resources = await prisma.studyResource.findMany({
      where: {
        courseId: course.id,
        status: "APPROVED",
        ...(topic ? { topic: { contains: topic, mode: "insensitive" } } : {}),
      },
      orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(resources);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { courseCode, type, title, url, description, topic } = await req.json();

    if (!courseCode || !type || !title || !url) {
      return NextResponse.json({ error: "Course, type, title, and URL are required" }, { status: 400 });
    }

    // Basic URL validation
    try { new URL(url); } catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }

    const course = await prisma.course.findUnique({ where: { courseCode: courseCode.toUpperCase() } });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const resource = await prisma.studyResource.create({
      data: {
        courseId: course.id,
        type,
        title,
        url,
        description: description || null,
        topic: topic || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, id: resource.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to submit resource" }, { status: 500 });
  }
}

// Upvote a resource
export async function PATCH(req: NextRequest) {
  try {
    const { resourceId, action, status } = await req.json();

    if (action === "upvote") {
      await prisma.studyResource.update({ where: { id: resourceId }, data: { upvotes: { increment: 1 } } });
    } else if (status) {
      await prisma.studyResource.update({ where: { id: resourceId }, data: { status } });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 });
  }
}
