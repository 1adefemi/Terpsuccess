import { prisma } from "@/lib/prisma";
import { computeMetrics } from "@/lib/metrics";
import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";

type Props = { params: { id: string } };
function Stars({ rating }: { rating: number }) {
  return <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 16, color: i <= Math.round(rating) ? "#FFD200" : "#D1D5DB" }}>★</span>)}</div>;
}
function diffColor(d: number) { return d <= 4 ? "#15803D" : d <= 7 ? "#D97706" : "#E03A3E"; }

export default async function ProfessorPage({ params }: Props) {
  const professor = await prisma.professor.findUnique({
    where: { id: params.id },
    include: {
      offerings: {
        include: { course: { include: { department: true } }, reports: { where: { status: "APPROVED" } } },
        orderBy: [{ year: "desc" }, { semester: "asc" }],
      },
      reviews: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!professor) notFound();

  const allReports = professor.offerings.flatMap(o => o.reports);
  const overallMetrics = computeMetrics(allReports);
  const avgRating = professor.reviews.length > 0 ? professor.reviews.reduce((a,b) => a+b.rating,0)/professor.reviews.length : null;

  const courseMap = new Map<string, { code: string; title: string; deptName: string; reports: typeof allReports; semesters: string[] }>();
  for (const o of professor.offerings) {
    const key = o.course.courseCode;
    if (!courseMap.has(key)) courseMap.set(key, { code: o.course.courseCode, title: o.course.title, deptName: o.course.department.name, reports: [], semesters: [] });
    courseMap.get(key)!.reports.push(...o.reports);
    courseMap.get(key)!.semesters.push(`${o.semester} ${o.year}`);
  }

  const initials = professor.fullName.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();

  return (
    <main style={{ minHeight: "100vh", background: "#FAFAF7" }}>
      <Nav />
      <div style={{ background: "#1A1A1A", padding: "32px 32px 40px", borderBottom: "3px solid #FFD200" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Link href="/browse?type=professors" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Professors</Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            <span style={{ color: "#FFD200", fontSize: 13, fontWeight: 700 }}>{professor.fullName}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 64, height: 64, background: "#FFD200", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: "#1A1A1A", flexShrink: 0 }}>{initials}</div>
            <div>
              <h1 style={{ fontSize: 30, fontWeight: 800, color: "white", letterSpacing: "-0.8px", marginBottom: 8 }}>{professor.fullName}</h1>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                {avgRating !== null && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Stars rating={avgRating} /><span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{avgRating.toFixed(1)} ({professor.reviews.length} reviews)</span></div>}
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{courseMap.size} course{courseMap.size!==1?"s":""} taught</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px" }}>
        {overallMetrics && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 32 }}>
            {[
              { label: "Avg Difficulty", value: `${overallMetrics.avgDifficulty.toFixed(1)}/10`, color: diffColor(overallMetrics.avgDifficulty) },
              { label: "Avg Workload", value: `${overallMetrics.avgWorkload.toFixed(1)} hrs/wk` },
              { label: "Reports", value: String(overallMetrics.reportCount) },
              { label: "Overall Rating", value: avgRating !== null ? `${avgRating.toFixed(1)}/5 ★` : "N/A", color: "#B89A00" },
            ].map(m => (
              <div key={m.label} style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9A9A9A", letterSpacing: "0.8px", marginBottom: 6, textTransform: "uppercase" }}>{m.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: m.color || "#1A1A1A" }}>{m.value}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
          <div>
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #FFD200" }}>Courses Taught</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Array.from(courseMap.entries()).map(([code, data]) => {
                  const m = computeMetrics(data.reports);
                  return (
                    <Link key={code} href={`/course/${code}`}>
                      <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "16px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#E03A3E", marginRight: 8 }}>{code}</span>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{data.title}</span>
                            <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 2 }}>{data.deptName}</div>
                          </div>
                          {m && <div style={{ display: "flex", gap: 12, textAlign: "right", flexShrink: 0 }}>
                            <div><div style={{ fontSize: 15, fontWeight: 700, color: diffColor(m.avgDifficulty) }}>{m.avgDifficulty.toFixed(1)}</div><div style={{ fontSize: 10, color: "#9A9A9A" }}>DIFFICULTY</div></div>
                          </div>}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {data.semesters.slice(0,4).map(s => <span key={s} style={{ fontSize: 11, background: "#F3F0E6", color: "#5A5A5A", padding: "3px 8px", borderRadius: 6 }}>{s}</span>)}
                          {data.semesters.length > 4 && <span style={{ fontSize: 11, color: "#9A9A9A" }}>+{data.semesters.length-4} more</span>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {professor.reviews.length > 0 && (
              <section>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #FFD200" }}>Student Reviews</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {professor.reviews.slice(0,10).map(r => (
                    <div key={r.id} style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "14px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Stars rating={r.rating} /><span style={{ fontSize: 12, fontWeight: 700, color: "#E03A3E" }}>{r.courseCode}</span></div>
                        <span style={{ fontSize: 11, color: "#9A9A9A" }}>{r.semester} {r.year}</span>
                      </div>
                      {r.comment && <p style={{ fontSize: 14, color: "#5A5A5A", lineHeight: 1.6, margin: 0 }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div>
            <div style={{ background: "#1A1A1A", borderRadius: 12, padding: 18 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 6 }}>Had this professor?</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14, lineHeight: 1.5 }}>Leave a review and help other Terps decide.</p>
              <Link href="/submit" style={{ display: "block", textAlign: "center", background: "#FFD200", color: "#1A1A1A", fontWeight: 700, fontSize: 13, padding: "10px 0", borderRadius: 8 }}>Submit a Review</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
