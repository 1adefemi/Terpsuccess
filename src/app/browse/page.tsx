"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CourseWithMetrics } from "@/types";

const DEPARTMENTS = ["CMSC", "ENEE", "MATH", "STAT", "PHYS", "CHEM", "BMGT", "ECON"];

export default function BrowsePage() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [dept, setDept] = useState("");
  const [courses, setCourses] = useState<CourseWithMetrics[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    const url = `/api/courses?q=${encodeURIComponent(query)}&dept=${dept}`;
    const res = await fetch(url);
    const data = await res.json();
    setCourses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, [query, dept]);

  const diffColor = (d: number) =>
    d <= 4 ? "text-green-400" : d <= 7 ? "text-yellow-400" : "text-red-400";

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-red-500 font-bold">TerpSuccess</Link>
        <span className="text-white/20">/</span>
        <span className="text-white/60">Browse</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8">Browse Courses</h1>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses..."
            className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500 transition-colors"
          />
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
          >
            <option value="" className="bg-[#1a1a1a]">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d} className="bg-[#1a1a1a]">{d}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-white/30 text-center py-20">Loading...</div>
        ) : courses.length === 0 ? (
          <div className="text-white/30 text-center py-20">No courses found.</div>
        ) : (
          <div className="space-y-3">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/course/${c.courseCode}`}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-5 hover:border-red-500/40 transition-all group"
              >
                <div>
                  <div className="text-red-400 font-bold text-sm mb-1">{c.courseCode}</div>
                  <div className="text-white group-hover:text-white/90 font-medium">{c.title}</div>
                  <div className="text-white/30 text-sm mt-1">{c.department.name}</div>
                </div>
                {c.metrics ? (
                  <div className="text-right text-sm shrink-0 ml-4">
                    <div className={`font-bold text-lg ${diffColor(c.metrics.avgDifficulty)}`}>
                      {c.metrics.avgDifficulty.toFixed(1)}
                      <span className="text-white/30 text-xs font-normal">/10</span>
                    </div>
                    <div className="text-white/40">{c.metrics.avgWorkload.toFixed(0)} hrs/wk</div>
                    <div className="text-white/30 text-xs">{c.metrics.reportCount} reports</div>
                  </div>
                ) : (
                  <div className="text-white/20 text-sm shrink-0 ml-4">No data yet</div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
