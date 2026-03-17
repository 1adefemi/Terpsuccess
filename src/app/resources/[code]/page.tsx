import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import ResourcesClient from "./ResourcesClient";

type Props = { params: { code: string } };

export default async function ResourcesPage({ params }: Props) {
  const course = await prisma.course.findUnique({
    where: { courseCode: params.code.toUpperCase() },
    include: {
      department: true,
      resources: {
        where: { status: "APPROVED" },
        orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
      },
      topics: { orderBy: { frequency: "desc" } },
    },
  });

  if (!course) notFound();

  return (
    <main style={{ minHeight: "100vh", background: "#FAFAF7" }}>
      <Nav />
      <div style={{ background: "#1A1A1A", padding: "28px 32px", borderBottom: "3px solid #FFD200" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Link href={`/course/${course.courseCode}`} style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{course.courseCode}</Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            <span style={{ color: "#FFD200", fontSize: 13, fontWeight: 700 }}>Study Resources</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "white", letterSpacing: "-0.5px", marginBottom: 4 }}>
            Study Resources
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15 }}>
            {course.courseCode} · {course.title} · Community-curated materials
          </p>
        </div>
      </div>
      <ResourcesClient
        courseCode={course.courseCode}
        initialResources={course.resources}
        topics={course.topics.map(t => t.topic)}
      />
    </main>
  );
}
