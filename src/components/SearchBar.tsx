"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Results = {
  courses: { id: string; courseCode: string; title: string; deptCode: string }[];
  professors: { id: string; fullName: string }[];
};

export default function SearchBar({ dark = false, large = false, placeholder = "Search courses or professors..." }: { dark?: boolean; large?: boolean; placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>({ courses: [], professors: [] });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.length < 2) { setResults({ courses: [], professors: [] }); setOpen(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setOpen((data.courses?.length + data.professors?.length) > 0);
      } catch { setOpen(false); }
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) { router.push(`/browse?q=${encodeURIComponent(query.trim())}`); setOpen(false); }
  };

  const bg = dark ? "rgba(255,255,255,0.06)" : "white";
  const border = dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.12)";
  const textColor = dark ? "white" : "#1A1A1A";

  return (
    <div ref={ref} style={{ position: "relative", flex: 1 }}>
      <form onSubmit={go} style={{ display: "flex", gap: 6, background: bg, border, borderRadius: large ? 14 : 10, padding: 5 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={placeholder}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: textColor, fontSize: large ? 16 : 14, padding: large ? "10px 12px" : "6px 10px" }}
        />
        <button type="submit" style={{ background: "#FFD200", color: "#1A1A1A", fontWeight: 700, fontSize: large ? 15 : 13, padding: large ? "10px 22px" : "6px 16px", borderRadius: large ? 10 : 7, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
          Search
        </button>
      </form>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden" }}>
          {results.courses.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9A9A9A", letterSpacing: "1px", padding: "10px 14px 5px", textTransform: "uppercase" }}>Courses</div>
              {results.courses.map(c => (
                <Link key={c.id} href={`/course/${c.courseCode}`} onClick={() => { setOpen(false); setQuery(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderTop: "1px solid rgba(0,0,0,0.04)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#FAFAF7")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#E03A3E", minWidth: 68 }}>{c.courseCode}</span>
                  <span style={{ fontSize: 13, color: "#1A1A1A", flex: 1 }}>{c.title}</span>
                  <span style={{ fontSize: 11, color: "#9A9A9A" }}>{c.deptCode}</span>
                </Link>
              ))}
            </>
          )}
          {results.professors.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9A9A9A", letterSpacing: "1px", padding: "10px 14px 5px", textTransform: "uppercase", borderTop: results.courses.length > 0 ? "1px solid rgba(0,0,0,0.07)" : "none" }}>Professors</div>
              {results.professors.map(p => (
                <Link key={p.id} href={`/professor/${p.id}`} onClick={() => { setOpen(false); setQuery(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderTop: "1px solid rgba(0,0,0,0.04)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#FAFAF7")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ width: 26, height: 26, background: "#FFF9E0", border: "2px solid #FFD200", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {p.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, color: "#1A1A1A" }}>{p.fullName}</span>
                </Link>
              ))}
            </>
          )}
          <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#FAFAF7" }}>
            <button onClick={go as unknown as React.MouseEventHandler} style={{ fontSize: 12, color: "#B89A00", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              See all results for "{query}" →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
