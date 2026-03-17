"use client";

import { useState } from "react";
import Link from "next/link";

type Report = {
  id: string;
  overallDifficulty: number;
  weeklyWorkloadHours: number;
  assignmentCount: number;
  midtermCount: number;
  midtermAverage: number | null;
  midtermDifficulty: number | null;
  classType: string;
  tipText: string | null;
  createdAt: Date;
  offering: {
    semester: string;
    year: number;
    course: { courseCode: string; title: string };
    professor: { fullName: string };
  };
};

type Stat = { status: string; _count: number };

export default function AdminClient({
  pending,
  stats,
}: {
  pending: Report[];
  stats: Stat[];
}) {
  const [reports, setReports] = useState(pending);
  const [processing, setProcessing] = useState<string | null>(null);

  const handle = async (id: string, status: "APPROVED" | "REJECTED") => {
    setProcessing(id);
    await fetch("/api/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: id, status }),
    });
    setReports((prev) => prev.filter((r) => r.id !== id));
    setProcessing(null);
  };

  const statMap = Object.fromEntries(stats.map((s) => [s.status, s._count]));

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-red-500 font-bold">TerpSuccess</Link>
        <span className="text-white/20">/</span>
        <span className="text-white/60">Admin</span>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Moderation Queue</h1>
        <p className="text-white/40 mb-8">Review and approve submitted course reports.</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Pending", key: "PENDING", color: "text-yellow-400" },
            { label: "Approved", key: "APPROVED", color: "text-green-400" },
            { label: "Rejected", key: "REJECTED", color: "text-red-400" },
          ].map((s) => (
            <div key={s.key} className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{statMap[s.key] ?? 0}</div>
              <div className="text-white/40 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Queue */}
        {reports.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            No pending reports. All caught up! ✅
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <div
                key={r.id}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-red-400 font-bold">{r.offering.course.courseCode}</span>
                    <span className="text-white/60 ml-2">{r.offering.course.title}</span>
                    <div className="text-white/40 text-sm mt-1">
                      {r.offering.professor.fullName} · {r.offering.semester} {r.offering.year}
                    </div>
                  </div>
                  <div className="text-white/20 text-xs">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/40 text-xs mb-1">Difficulty</div>
                    <div className="text-white font-medium">{r.overallDifficulty}/10</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/40 text-xs mb-1">Workload</div>
                    <div className="text-white font-medium">{r.weeklyWorkloadHours} hrs/wk</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/40 text-xs mb-1">Assignments</div>
                    <div className="text-white font-medium">{r.assignmentCount}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/40 text-xs mb-1">Midterms</div>
                    <div className="text-white font-medium">{r.midtermCount}</div>
                  </div>
                  {r.midtermAverage !== null && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-white/40 text-xs mb-1">Midterm Avg</div>
                      <div className="text-white font-medium">{r.midtermAverage}%</div>
                    </div>
                  )}
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/40 text-xs mb-1">Type</div>
                    <div className="text-white font-medium text-xs">{r.classType.replace("_", " ")}</div>
                  </div>
                </div>

                {/* Tip */}
                {r.tipText && (
                  <div className="bg-white/5 rounded-lg p-3 mb-4 text-white/60 text-sm italic">
                    &ldquo;{r.tipText}&rdquo;
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handle(r.id, "APPROVED")}
                    disabled={processing === r.id}
                    className="flex-1 bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 transition-colors py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handle(r.id, "REJECTED")}
                    disabled={processing === r.id}
                    className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
