// src/app/course/[code]/page.tsx

import { prisma } from "@/lib/prisma";
import { computeMetrics } from "@/lib/metrics";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = { params: { code: string } };

function DifficultyBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color =
    value <= 4 ? "bg-green-500" : value <= 7 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-full bg-white/10 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="text-white/40 text-xs uppercase tracking-widest mb-2">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-white/40 text-sm mt-1">{sub}</div>}
    </div>
  );
}

export default async function CoursePage({ params }: Props) {
  const course = await prisma.course.findUnique({
    where: { courseCode: params.code.toUpperCase() },
    include: {
      department: true,
      offerings: {
        include: {
          professor: true,
          reports: { where: { status: "APPROVED" } },
        },
        orderBy: [{ year: "desc" }, { semester: "asc" }],
      },
    },
  });

  if (!course) notFound();

  const allReports = course.offerings.flatMap((o) => o.reports);
  const metrics = computeMetrics(allReports);

  const tips = allReports
    .filter((r) => r.tipText)
    .map((r) => r.tipText!)
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-red-500 font-bold">TerpSuccess</Link>
        <span className="text-white/20">/</span>
        <span className="text-white/60">{course.courseCode}</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="text-red-400 text-sm font-semibold mb-2">{course.department.code}</div>
          <h1 className="text-4xl font-bold mb-2">{course.courseCode}</h1>
          <p className="text-white/50 text-lg">{course.title}</p>
          {metrics && (
            <p className="text-white/30 text-sm mt-2">
              Based on {metrics.reportCount} student report{metrics.reportCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {metrics ? (
          <>
            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <MetricCard
                label="Difficulty"
                value={`${metrics.avgDifficulty.toFixed(1)} / 10`}
              />
              <MetricCard
                label="Workload"
                value={`${metrics.avgWorkload.toFixed(1)} hrs`}
                sub="per week"
              />
              <MetricCard
                label="Assignments"
                value={metrics.avgAssignmentCount.toFixed(0)}
                sub="per semester"
              />
              <MetricCard
                label="Midterms"
                value={metrics.avgMidtermCount.toFixed(0)}
              />
              {metrics.avgMidtermAverage !== null && (
                <MetricCard
                  label="Midterm Avg"
                  value={`${metrics.avgMidtermAverage.toFixed(1)}%`}
                />
              )}
              {metrics.avgMidtermDifficulty !== null && (
                <MetricCard
                  label="Midterm Difficulty"
                  value={`${metrics.avgMidtermDifficulty.toFixed(1)} / 10`}
                />
              )}
            </div>

            {/* Difficulty bar */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/40 text-xs uppercase tracking-widest">Overall Difficulty</span>
                <span className="text-white font-bold">{metrics.avgDifficulty.toFixed(1)} / 10</span>
              </div>
              <DifficultyBar value={metrics.avgDifficulty} />
              <div className="mt-3 text-sm text-white/40">
                Class type:{" "}
                <span className="text-white/70">
                  {metrics.dominantClassType.replace("_", " ").toLowerCase()}
                </span>
              </div>
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
            <p className="text-white/40">No reports yet for this course.</p>
            <p className="text-white/30 text-sm mt-2">Be the first to help your fellow Terps.</p>
          </div>
        )}

        {/* Professors */}
        {course.offerings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">
              Professors
            </h2>
            <div className="space-y-3">
              {Array.from(
                new Map(course.offerings.map((o) => [o.professor.id, o.professor]))
              ).map(([, prof]) => {
                const profReports = course.offerings
                  .filter((o) => o.professorId === prof.id)
                  .flatMap((o) => o.reports);
                const m = computeMetrics(profReports);
                return (
                  <Link
                    key={prof.id}
                    href={`/professor/${prof.id}`}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4 hover:border-red-500/40 transition-all"
                  >
                    <span className="text-white/80">{prof.fullName}</span>
                    {m && (
                      <span className="text-white/40 text-sm">
                        Difficulty: {m.avgDifficulty.toFixed(1)}/10
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
          href={`/submit?course=${course.courseCode}`}
          className="block w-full text-center bg-red-500 hover:bg-red-600 transition-colors py-3 rounded-lg font-semibold"
        >
          Submit a Course Report
        </Link>
      </div>
    </main>
  );
}
