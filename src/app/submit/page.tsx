"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const SEMESTERS = ["FALL", "SPRING", "SUMMER", "WINTER"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

function Slider({
  label,
  name,
  value,
  onChange,
  min = 1,
  max = 10,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-white/70 text-sm">{label}</label>
        <span className="text-red-400 font-bold text-sm">{value} / {max}</span>
      </div>
      <input
        type="range"
        name={name}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-red-500"
      />
      <div className="flex justify-between text-white/20 text-xs mt-1">
        <span>Easy</span>
        <span>Hard</span>
      </div>
    </div>
  );
}

export default function SubmitPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    courseCode: params.get("course") || "",
    professorName: "",
    semester: "FALL",
    year: CURRENT_YEAR,
    overallDifficulty: 5,
    weeklyWorkloadHours: 8,
    assignmentCount: 5,
    midtermCount: 2,
    midtermAverage: "",
    midtermDifficulty: 5,
    classType: "BALANCED" as "EXAM_HEAVY" | "PROJECT_HEAVY" | "BALANCED",
    tipText: "",
  });

  const set = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        midtermAverage: form.midtermAverage ? parseFloat(form.midtermAverage) : undefined,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Report Submitted!</h2>
          <p className="text-white/50 mb-6">
            Your report is under review and will go live shortly. Thank you for helping fellow Terps.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/" className="text-red-400 hover:text-red-300 transition-colors">
              Go Home
            </Link>
            <button
              onClick={() => { setSubmitted(false); setForm((f) => ({ ...f, courseCode: "", professorName: "", tipText: "", midtermAverage: "" })); }}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
            >
              Submit Another
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-red-500 font-bold">TerpSuccess</Link>
        <span className="text-white/20">/</span>
        <span className="text-white/60">Submit Report</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Submit a Course Report</h1>
        <p className="text-white/40 mb-8">
          Anonymous. Takes ~2 minutes. Helps hundreds of future students.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course & Professor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/70 text-sm block mb-2">Course Code *</label>
              <input
                required
                value={form.courseCode}
                onChange={(e) => set("courseCode", e.target.value.toUpperCase())}
                placeholder="e.g. CMSC351"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm block mb-2">Professor *</label>
              <input
                required
                value={form.professorName}
                onChange={(e) => set("professorName", e.target.value)}
                placeholder="Full name"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          {/* Semester & Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/70 text-sm block mb-2">Semester *</label>
              <select
                value={form.semester}
                onChange={(e) => set("semester", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/70 text-sm block mb-2">Year *</label>
              <select
                value={form.year}
                onChange={(e) => set("year", parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y} className="bg-[#1a1a1a]">{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sliders */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
            <Slider
              label="Overall Difficulty"
              name="overallDifficulty"
              value={form.overallDifficulty}
              onChange={(v) => set("overallDifficulty", v)}
            />
          </div>

          {/* Workload & counts */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-white/70 text-sm block mb-2">Hrs/Week *</label>
              <input
                required
                type="number"
                min={0}
                max={60}
                step={0.5}
                value={form.weeklyWorkloadHours}
                onChange={(e) => set("weeklyWorkloadHours", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm block mb-2">Assignments *</label>
              <input
                required
                type="number"
                min={0}
                max={50}
                value={form.assignmentCount}
                onChange={(e) => set("assignmentCount", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm block mb-2">Midterms *</label>
              <input
                required
                type="number"
                min={0}
                max={10}
                value={form.midtermCount}
                onChange={(e) => set("midtermCount", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          {/* Midterm data */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
            <p className="text-white/40 text-xs uppercase tracking-widest">Midterm Data (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/70 text-sm block mb-2">Midterm Average (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.midtermAverage}
                  onChange={(e) => set("midtermAverage", e.target.value)}
                  placeholder="e.g. 68"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-2">Midterm Difficulty</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.midtermDifficulty}
                  onChange={(e) => set("midtermDifficulty", e.target.value)}
                  placeholder="1–10"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Class type */}
          <div>
            <label className="text-white/70 text-sm block mb-3">Class Type *</label>
            <div className="grid grid-cols-3 gap-3">
              {(["EXAM_HEAVY", "PROJECT_HEAVY", "BALANCED"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => set("classType", t)}
                  className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                    form.classType === t
                      ? "border-red-500 bg-red-500/20 text-red-300"
                      : "border-white/10 text-white/50 hover:border-white/20"
                  }`}
                >
                  {t.replace("_", " ").toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div>
            <label className="text-white/70 text-sm block mb-2">Tip for Future Students</label>
            <textarea
              value={form.tipText}
              onChange={(e) => set("tipText", e.target.value)}
              placeholder="e.g. Start projects early. Midterm 1 focuses heavily on sorting algorithms."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-red-500 transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors py-3 rounded-lg font-semibold"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </main>
  );
}
