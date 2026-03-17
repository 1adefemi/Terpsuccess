"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";

const ALL_DEPTS = ["AASP","AAST","AGNR","AGST","AMSC","AMST","ANSC","ANTH","AOSC","ARAB","ARCH","AREC","ARHU","ARMY","ARSC","ARTH","ARTT","ASTR","BCHM","BDBA","BIOE","BIOL","BIOM","BIPH","BISI","BMGT","BMIN","BSCI","BSOS","BUAC","BUDT","BUFN","BULM","BUMK","BUMO","BUSI","BUSM","BUSO","CBMG","CCJS","CHBE","CHEM","CHIN","CHPH","CHSE","CINE","CLAS","CLFS","CMLT","CMSC","COMM","CPBE","CPSP","DANC","DATA","ECON","EDCP","EDHD","EDHI","EDSP","EDUC","EMBA","ENAE","ENAI","ENBC","ENCE","ENCO","ENEB","ENED","ENEE","ENES","ENFP","ENGL","ENMA","ENME","ENMT","ENPM","ENRE","ENSE","ENSP","ENST","ENTM","ENTS","ENVH","EPIB","FGSM","FIRE","FMSC","FREN","GBHL","GEMS","GEOG","GEOL","GERS","GFPL","GLBC","GREK","GVPT","HACS","HBUS","HDCC","HEBR","HESI","HESP","HGLO","HHUM","HISP","HIST","HLSA","HLSC","HLTH","HNUH","HONR","IDEA","IMDM","IMMR","INAG","INFM","INST","ISRL","ITAL","JAPN","JOUR","JWST","KNES","KORA","LACS","LARC","LATN","LBSC","LEAD","LGBT","LING","MATH","MEES","MIEH","MLSC","MOCB","MUED","MUSC","NACS","NAVY","NEUR","NFSC","PBAF","PBIO","PERS","PHIL","PHPE","PHSC","PHYS","PLCY","PLSC","PORT","PSYC","PUAF","QMMS","RDEV","RELS","RUSS","SDSB","SLAA","SLLC","SMLP","SOCY","SPAN","SPHL","STAT","SURV","TDPS","THET","TLPL","TLTC","UMEI","UNIV","URSP","USLT","VIPS","VMSC","WEID","WGSS","XPER"];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type Course = { id: string; courseCode: string; title: string; credits?: number; department: { code: string; name: string }; metrics: { avgDifficulty: number; avgWorkload: number; reportCount: number } | null };
type Professor = { id: string; fullName: string; courses: { courseCode: string }[] };

function diffColor(d: number) { return d <= 4 ? "#15803D" : d <= 7 ? "#D97706" : "#E03A3E"; }

function BrowseContent() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [activeDept, setActiveDept] = useState(params.get("dept") || "");
  const [tab, setTab] = useState<"courses" | "professors">(params.get("type") === "professors" ? "professors" : "courses");
  const [activeLetter, setActiveLetter] = useState("A");
  const [courses, setCourses] = useState<Course[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab !== "courses") return;
    setLoading(true);
    fetch(`/api/courses?q=${encodeURIComponent(query)}&dept=${activeDept}&limit=500`)
      .then(r => r.json()).then(d => { setCourses(Array.isArray(d) ? d : []); setLoading(false); });
  }, [query, activeDept, tab]);

  useEffect(() => {
    if (tab !== "professors") return;
    setLoading(true);
    fetch(`/api/professors?q=${encodeURIComponent(query)}`)
      .then(r => r.json()).then(d => { setProfessors(Array.isArray(d) ? d : []); setLoading(false); });
  }, [query, tab]);

  // Filter professors by last name starting letter
  const filteredProfs = professors.filter(p => {
    const lastName = p.fullName.trim().split(" ").slice(-1)[0] || "";
    return lastName.toUpperCase().startsWith(activeLetter);
  }).sort((a, b) => {
    const aLast = a.fullName.trim().split(" ").slice(-1)[0] || "";
    const bLast = b.fullName.trim().split(" ").slice(-1)[0] || "";
    return aLast.localeCompare(bLast);
  });

  // Count professors per letter for badge display
  const letterCounts = ALPHABET.reduce((acc, l) => {
    acc[l] = professors.filter(p => {
      const lastName = p.fullName.trim().split(" ").slice(-1)[0] || "";
      return lastName.toUpperCase().startsWith(l);
    }).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <main style={{ minHeight: "100vh", background: "#FAFAF7" }}>
      <Nav />

      {/* Top search bar */}
      <div style={{ background: "#1A1A1A", padding: "14px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 12, alignItems: "center" }}>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder={tab === "courses" ? "Filter courses..." : "Filter professors by name..."}
            style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 16px", color: "white", fontSize: 14, outline: "none" }} />
          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)" }}>
            {(["courses", "professors"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setQuery(""); }}
                style={{ padding: "9px 20px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: tab === t ? "#FFD200" : "transparent", color: tab === t ? "#1A1A1A" : "rgba(255,255,255,0.6)", textTransform: "capitalize" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px" }}>

        {/* COURSES TAB */}
        {tab === "courses" && (
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24 }}>
            {/* Dept sidebar */}
            <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 10, height: "fit-content", position: "sticky", top: 70 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9A9A9A", letterSpacing: "1px", marginBottom: 8, padding: "0 4px" }}>DEPARTMENTS</div>
              <button onClick={() => setActiveDept("")} style={{ width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: activeDept === "" ? 700 : 400, background: activeDept === "" ? "#FFD200" : "transparent", marginBottom: 2, display: "block" }}>
                All
              </button>
              <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                {ALL_DEPTS.map(d => (
                  <button key={d} onClick={() => setActiveDept(d)}
                    style={{ width: "100%", textAlign: "left", padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: activeDept === d ? 700 : 400, background: activeDept === d ? "#FFD200" : "transparent", display: "block", marginBottom: 1 }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Course list */}
            <div>
              <div style={{ fontSize: 13, color: "#9A9A9A", marginBottom: 14 }}>{courses.length} course{courses.length !== 1 ? "s" : ""}{activeDept ? ` in ${activeDept}` : ""}</div>
              {loading ? <div style={{ textAlign: "center", padding: "60px 0", color: "#9A9A9A" }}>Loading...</div> : courses.length === 0 ? <div style={{ textAlign: "center", padding: "60px 0", color: "#9A9A9A" }}>No courses found.</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {courses.map(c => (
                    <Link key={c.id} href={`/course/${c.courseCode}`}>
                      <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#E03A3E" }}>{c.courseCode}</span>
                            {c.credits && <span style={{ fontSize: 11, color: "#9A9A9A" }}>{c.credits} credits</span>}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{c.title}</div>
                          <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 2 }}>{c.department.name}</div>
                        </div>
                        {c.metrics ? (
                          <div style={{ display: "flex", gap: 20, textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                            <div><div style={{ fontSize: 16, fontWeight: 700, color: diffColor(c.metrics.avgDifficulty) }}>{c.metrics.avgDifficulty.toFixed(1)}</div><div style={{ fontSize: 10, color: "#9A9A9A" }}>DIFFICULTY</div></div>
                            <div><div style={{ fontSize: 16, fontWeight: 700 }}>{c.metrics.avgWorkload.toFixed(0)}h</div><div style={{ fontSize: 10, color: "#9A9A9A" }}>PER WEEK</div></div>
                            <div><div style={{ fontSize: 16, fontWeight: 700 }}>{c.metrics.reportCount}</div><div style={{ fontSize: 10, color: "#9A9A9A" }}>REPORTS</div></div>
                          </div>
                        ) : <span style={{ fontSize: 12, color: "#9A9A9A", flexShrink: 0, marginLeft: 16 }}>No data yet</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROFESSORS TAB */}
        {tab === "professors" && (
          <div>
            {/* A-Z letter tabs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 20 }}>
              {ALPHABET.map(l => (
                <button key={l} onClick={() => setActiveLetter(l)}
                  style={{ width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, background: activeLetter === l ? "#FFD200" : letterCounts[l] > 0 ? "white" : "rgba(0,0,0,0.04)", color: activeLetter === l ? "#1A1A1A" : letterCounts[l] > 0 ? "#1A1A1A" : "#C0C0C0", border: activeLetter === l ? "2px solid #FFD200" : "1px solid rgba(0,0,0,0.08)" as unknown as undefined, position: "relative" }}>
                  {l}
                  {letterCounts[l] > 0 && (
                    <span style={{ position: "absolute", top: -4, right: -4, background: "#E03A3E", color: "white", fontSize: 9, fontWeight: 700, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {letterCounts[l] > 99 ? "99+" : letterCounts[l]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 13, color: "#9A9A9A", marginBottom: 14 }}>
              {loading ? "Loading..." : `${filteredProfs.length} professor${filteredProfs.length !== 1 ? "s" : ""} with last name starting with "${activeLetter}"`}
            </div>

            {loading ? <div style={{ textAlign: "center", padding: "60px 0", color: "#9A9A9A" }}>Loading...</div> : filteredProfs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#9A9A9A" }}>No professors found for letter "{activeLetter}".</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {filteredProfs.map(p => {
                  const lastName = p.fullName.trim().split(" ").slice(-1)[0] || "";
                  const firstName = p.fullName.trim().split(" ").slice(0, -1).join(" ");
                  return (
                    <Link key={p.id} href={`/professor/${p.id}`}>
                      <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: 16, cursor: "pointer" }}>
                        <div style={{ width: 40, height: 40, background: "#FFF9E0", border: "2px solid #FFD200", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
                          {p.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                          <span style={{ color: "#E03A3E" }}>{lastName}</span>{firstName ? `, ${firstName}` : ""}
                        </div>
                        <div style={{ fontSize: 12, color: "#9A9A9A" }}>{p.courses.length} course{p.courses.length !== 1 ? "s" : ""} taught</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#9A9A9A" }}>Loading...</div>}>
      <BrowseContent />
    </Suspense>
  );
}
