// src/app/professor/[id]/page.tsx

import { prisma } from "@/lib/prisma";
import { computeMetrics } from "@/lib/metrics";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = { params: { id: string } };

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center">
      <div className="text-white/40 text-xs uppercase tracking-widest mb-1">{label}</div>
      <div className="text-white font-bold">{value}</div>
    </div>
  );
}

export default async function ProfessorPage({ params }: Props) {
  const professor = await prisma.professor.findUnique({
    where: { id: params.id },
    include: {
      offerings: {
        include: {
          course: { include: { department: true } },
          reports: { where: { status: "APPROVED" } },
        },
        orderBy: [{ year: "desc" }, { semester: "asc" }],
      },
    },
  });

  if (!professor) notFound();

  // Aggregate all reports across all offerings for this professor
  const allReports = professor.offerings.flatMap((o) => o.reports);
  const overallMetrics = computeMetrics(allReports);

  // Group by course
  const courseMap = new Map<string, { code: string; title: string; reports: typeof allReports }>();
  for (const offering of professor.offerings) {
    const key = offering.course.courseCode;
    if (!courseMap.has(key)) {
      courseMap.set(key, {
        code: offering.course.courseCode,
        title: offering.course.title,
        reports: [],
      });
    }
    courseMap.get(key)!.reports.push(...offering.reports);
  }

  const tips = allReports
    .filter((r) => r.tipText)
    .map((r) => r.tipText!)
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-red-500 font-bold">TerpSuccess</Link>
        <span className="text-white/20">/</span>
        <span className="text-white/60">{professor.fullName}</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="text-red-400 text-sm font-semibold mb-2">PROFESSOR</div>
          <h1 className="text-4xl font-bold mb-2">{professor.fullName}</h1>
          {overallMetrics && (
            <p className="text-white/30 text-sm">
              Based on {overallMetrics.reportCount} student report{overallMetrics.reportCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Overall metrics */}
        {overallMetrics ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <MetricPill label="Difficulty" value={`${overallMetrics.avgDifficulty.toFixed(1)} / 10`} />
              <MetricPill label="Workload" value={`${overallMetrics.avgWorkload.toFixed(1)} hrs/wk`} />
              <MetricPill label="Assignments" value={overallMetrics.avgAssignmentCount.toFixed(0)} />
              <MetricPill label="Midterms" value={overallMetrics.avgMidtermCount.toFixed(0)} />
            </div>

            {/* Student tips */}
            {tips.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">
                  Student Tips
                </h2>
                <div className="space-y-3">
                  {tips.map((tip, i) => (
                    <div
                      key={i}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 text-white/70 text-sm"
                    >
                      &ldquo;{tip}&rdquo;
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center mb-8">
            <p className="text-white/40">No reports yet for this professor.</p>
          </div>
        )}

        {/* Courses taught */}
        {courseMap.size > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">
              Courses Taught
            </h2>
            <div className="space-y-3">
              {[...courseMap.entries()].map(([code, data]) => {
                const m = computeMetrics(data.reports);
                return (
                  <Link
                    key={code}
                    href={`/course/${code}`}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4 hover:border-red-500/40 transition-all"
                  >
                    <div>
                      <span className="text-red-400 font-bold text-sm">{code}</span>
                      <span className="text-white/60 text-sm ml-3">{data.title}</span>
                    </div>
                    {m && (
                      <span className="text-white/40 text-sm">
                        {m.avgDifficulty.toFixed(1)}/10 · {m.reportCount} reports
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/submit`}
          className="block w-full text-center bg-red-500 hover:bg-red-600 transition-colors py-3 rounded-lg font-semibold"
        >
          Submit a Report for This Professor
        </Link>
      </div>
    </main>
  );
}
