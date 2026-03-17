"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/browse?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const popularCourses = [
    { code: "CMSC351", title: "Algorithms" },
    { code: "ENEE245", title: "Circuits" },
    { code: "STAT400", title: "Applied Probability & Statistics" },
    { code: "MATH241", title: "Calculus III" },
    { code: "CMSC216", title: "Intro to Computer Systems" },
    { code: "ENEE303", title: "Signals & Systems" },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-xl tracking-tight text-red-500">
          TerpSuccess
        </span>
        <div className="flex gap-4 text-sm text-white/60">
          <Link href="/browse" className="hover:text-white transition-colors">Browse</Link>
          <Link href="/submit" className="hover:text-white transition-colors">Submit Report</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block bg-red-500/10 text-red-400 text-xs font-semibold px-3 py-1 rounded-full mb-6 border border-red-500/20">
          UMD COURSE INTELLIGENCE
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-4 leading-tight">
          How hard is this class{" "}
          <span className="text-red-500">actually?</span>
        </h1>
        <p className="text-white/50 text-lg mb-10">
          Real data from UMD students — midterm averages, weekly workload,
          assignment count, and survival tips.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a course or professor... (e.g. CMSC351)"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500 transition-colors"
          />
          <button
            type="submit"
            className="bg-red-500 hover:bg-red-600 transition-colors px-6 py-3 rounded-lg font-semibold"
          >
            Search
          </button>
        </form>
      </section>

      {/* Popular Courses */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">
          Popular Courses
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {popularCourses.map((c) => (
            <Link
              key={c.code}
              href={`/course/${c.code}`}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-red-500/40 hover:bg-white/8 transition-all group"
            >
              <div className="text-red-400 font-bold text-sm mb-1 group-hover:text-red-300">
                {c.code}
              </div>
              <div className="text-white/60 text-sm">{c.title}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-t border-white/10 py-8">
        <div className="max-w-3xl mx-auto px-6 flex justify-around text-center">
          {[
            { label: "Courses", value: "200+" },
            { label: "Reports", value: "1,000+" },
            { label: "Students Helped", value: "5,000+" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-red-400">{s.value}</div>
              <div className="text-white/40 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
