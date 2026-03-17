"use client";
import Link from "next/link";
import Nav from "@/components/Nav";
import SearchBar from "@/components/SearchBar";

const POPULAR = [
  { code: "CMSC351", title: "Algorithms", diff: 8.2, hrs: 12 },
  { code: "ENEE245", title: "Circuits", diff: 7.8, hrs: 10 },
  { code: "STAT400", title: "Applied Probability & Statistics", diff: 6.5, hrs: 7 },
  { code: "MATH241", title: "Calculus III", diff: 7.1, hrs: 9 },
  { code: "CMSC216", title: "Intro to Computer Systems", diff: 8.5, hrs: 14 },
  { code: "PSYC100", title: "Introduction to Psychology", diff: 3.2, hrs: 4 },
];
const DEPTS = ["CMSC","ENEE","MATH","STAT","BMGT","PHYS","CHEM","PSYC","BIOL","ECON","HIST","ENGL","KNES","JOUR","LING","SOCY","ANTH","GVPT","ARTT","MUSC"];

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#FAFAF7" }}>
      <Nav />
      <section style={{ background: "#1A1A1A", padding: "64px 32px 72px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "repeating-linear-gradient(90deg,#FFD200 0,#FFD200 25%,#1A1A1A 25%,#1A1A1A 50%,#E03A3E 50%,#E03A3E 75%,#1A1A1A 75%,#1A1A1A 100%)", backgroundSize: "40px 4px" }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,210,0,0.12)", border: "1px solid rgba(255,210,0,0.25)", color: "#FFD200", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", padding: "5px 14px", borderRadius: 20, marginBottom: 24, textTransform: "uppercase" }}>🐢 Independent Student Project · UMD</div>
        <h1 style={{ fontSize: "clamp(36px,5vw,52px)", fontWeight: 800, color: "white", lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: 16 }}>
          Ace your semester.<br /><span style={{ color: "#FFD200" }}>Know before you go.</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 17, marginBottom: 36, lineHeight: 1.5 }}>
          Real data from Terps — midterm averages, workload, professor ratings, and survival tips.
        </p>
        <div style={{ maxWidth: 620, margin: "0 auto 16px" }}>
          <SearchBar dark large placeholder="Search any course or professor... (e.g. CMSC351)" />
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 48, marginTop: 40, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {[{ val: "4,699", label: "Courses" }, { val: "10,626", label: "Professors" }, { val: "204", label: "Departments" }].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ color: "#FFD200", fontSize: 28, fontWeight: 800, letterSpacing: "-1px" }}>{s.val}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 960, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>🔥 Most Searched Courses</h2>
          <Link href="/browse" style={{ fontSize: 13, color: "#B89A00", fontWeight: 600 }}>View all →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {POPULAR.map(c => (
            <Link key={c.code} href={`/course/${c.code}`}>
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#E03A3E", letterSpacing: "0.5px", marginBottom: 4 }}>{c.code}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, lineHeight: 1.3 }}>{c.title}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "#FEF3C7", color: "#92400E" }}>{c.diff}/10 difficulty</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "#E0F2FE", color: "#075985" }}>{c.hrs} hrs/wk</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div style={{ background: "white", borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "40px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Browse by Department</h2>
            <Link href="/browse" style={{ fontSize: 13, color: "#B89A00", fontWeight: 600 }}>All →</Link>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {DEPTS.map(d => <Link key={d} href={`/browse?dept=${d}`} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 13, fontWeight: 700, color: "#1A1A1A", background: "white" }}>{d}</Link>)}
          </div>
        </div>
      </div>

      <section style={{ textAlign: "center", padding: "56px 32px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Took a class recently?</h2>
        <p style={{ color: "#5A5A5A", marginBottom: 24, fontSize: 15 }}>Submit a report and help the next Terp survive it.</p>
        <Link href="/submit" style={{ display: "inline-block", background: "#1A1A1A", color: "#FFD200", fontWeight: 700, fontSize: 15, padding: "14px 32px", borderRadius: 12 }}>Submit a Course Report →</Link>
      </section>

      <footer style={{ background: "#E03A3E", color: "white", textAlign: "center", padding: "16px 32px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          Built by Terps, for Terps 🐢 · <span style={{ color: "#FFD200" }}>TerpSuccess</span>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
          TerpSuccess is an independent student project and is not affiliated with or endorsed by the University of Maryland. · Grade data via <a href="https://planetterp.com" target="_blank" rel="noreferrer" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "underline" }}>PlanetTerp</a>
        </div>
      </footer>
    </main>
  );
}
