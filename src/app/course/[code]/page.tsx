import { prisma } from "@/lib/prisma";
import { computeMetrics } from "@/lib/metrics";
import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";

type Props = { params: { code: string } };
function diffColor(d: number) { return d <= 4 ? "#15803D" : d <= 7 ? "#D97706" : "#E03A3E"; }
function Stars({ rating }: { rating: number }) {
  return <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 14, color: i <= Math.round(rating) ? "#FFD200" : "#D1D5DB" }}>★</span>)}</div>;
}
function MetricBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "14px 18px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9A9A9A", letterSpacing: "0.8px", marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || "#1A1A1A" }}>{value}</div>
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
          professor: { include: { reviews: { where: { status: "APPROVED", courseCode: params.code.toUpperCase() } } } },
          reports: { where: { status: "APPROVED" } },
          midterms: { include: { reviews: { where: { status: "APPROVED" } } }, orderBy: { midtermNum: "asc" } },

          gradeDistributions: true,
        },
        orderBy: [{ year: "desc" }, { semester: "asc" }],
      },
      topics: { orderBy: { frequency: "desc" } },
      prereq: true,
    },
  });

  if (!course) notFound();
  await prisma.course.update({ where: { id: course.id }, data: { viewCount: { increment: 1 } } });

  const allReports = course.offerings.flatMap(o => o.reports);
  const metrics = computeMetrics(allReports);
  const tips = allReports.filter(r => r.tipText).map(r => r.tipText!).slice(0, 6);

  // Build professor map
  const profMap = new Map<string, { id: string; fullName: string; avgRating: number | null; reviewCount: number; semesters: string[] }>();
  for (const o of course.offerings) {
    const p = o.professor;
    if (!profMap.has(p.id)) {
      const ratings = p.reviews.map(r => r.rating);
      profMap.set(p.id, { id: p.id, fullName: p.fullName, avgRating: ratings.length > 0 ? ratings.reduce((a,b) => a+b,0)/ratings.length : null, reviewCount: ratings.length, semesters: [] });
    }
    profMap.get(p.id)!.semesters.push(`${o.semester} ${o.year}`);
  }

  // Build midterm data keyed by midterm number (1-5 always shown, plus "final" = 0)
  const allMidtermRecords = course.offerings.flatMap(o =>
    o.midterms.map(m => ({ ...m, semester: o.semester, year: o.year, professorName: o.professor.fullName }))
  );

  // Group by midterm number
  const midtermData: Record<number, { records: typeof allMidtermRecords; avgScore: number | null; avgDiff: number | null; topTopics: [string, number][]; tips: string[] }> = {};
  for (let i = 0; i <= 5; i++) { // 0 = final, 1-5 = midterms
    const records = allMidtermRecords.filter(m => m.midtermNum === i);
    const allReviews = records.flatMap(r => r.reviews);
    const scores = records.filter(r => r.avgScore !== null).map(r => r.avgScore!);
    const diffs = allReviews.map(r => r.difficulty);
    const topicFreq = allReviews.flatMap(r => r.topicsCovered).reduce((acc, t) => { acc[t] = (acc[t]||0)+1; return acc; }, {} as Record<string,number>);
    midtermData[i] = {
      records,
      avgScore: scores.length > 0 ? scores.reduce((a,b)=>a+b,0)/scores.length : null,
      avgDiff: diffs.length > 0 ? diffs.reduce((a,b)=>a+b,0)/diffs.length : null,
      topTopics: Object.entries(topicFreq).sort((a,b)=>b[1]-a[1]).slice(0,6),
      tips: allReviews.filter(r => r.tips).map(r => r.tips!).slice(0,3),
    };
  }

  // Topics from admin
  const generalTopics = course.topics.filter(t => t.midtermNum === null);
  const topicsByMidterm = new Map<number, typeof course.topics>();
  for (const t of course.topics.filter(t => t.midtermNum !== null)) {
    if (!topicsByMidterm.has(t.midtermNum!)) topicsByMidterm.set(t.midtermNum!, []);
    topicsByMidterm.get(t.midtermNum!)!.push(t);
  }



  const examItems = [
    { label: "Midterm 1", num: 1 }, { label: "Midterm 2", num: 2 }, { label: "Midterm 3", num: 3 },
    { label: "Midterm 4", num: 4 }, { label: "Midterm 5", num: 5 }, { label: "Final Exam", num: 0 },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#FAFAF7" }}>
      <Nav />
      <div style={{ background: "#1A1A1A", padding: "32px 32px 40px", borderBottom: "3px solid #FFD200" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Link href="/browse" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Browse</Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            <Link href={`/browse?dept=${course.department.code}`} style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{course.department.code}</Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            <span style={{ color: "#FFD200", fontSize: 13, fontWeight: 700 }}>{course.courseCode}</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "white", letterSpacing: "-1px", marginBottom: 6 }}>{course.courseCode}</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, marginBottom: 8 }}>{course.title}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{course.department.name}</span>
            {course.credits && <span style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 12, padding: "3px 10px", borderRadius: 20 }}>{course.credits} credits</span>}
            {metrics && <span style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 12, padding: "3px 10px", borderRadius: 20 }}>{metrics.reportCount} student reports</span>}
          </div>
          {course.description && <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginTop: 12, maxWidth: 680, lineHeight: 1.6 }}>{course.description}</p>}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px" }}>
        {metrics ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 32 }}>
            <MetricBox label="Overall Difficulty" value={`${metrics.avgDifficulty.toFixed(1)} / 10`} color={diffColor(metrics.avgDifficulty)} />
            <MetricBox label="Weekly Workload" value={`${metrics.avgWorkload.toFixed(1)} hrs/wk`} />
            <MetricBox label="Midterms (avg)" value={metrics.avgMidtermCount.toFixed(0)} />
            {metrics.avgProjectCount > 0 && <MetricBox label="Projects (avg)" value={metrics.avgProjectCount.toFixed(0)} />}
            {metrics.avgLabCount > 0 && <MetricBox label="Labs (avg)" value={metrics.avgLabCount.toFixed(0)} />}
            {metrics.avgHwCount > 0 && <MetricBox label="Homework (avg)" value={metrics.avgHwCount.toFixed(0)} />}
          </div>
        ) : (
          <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 32, textAlign: "center", marginBottom: 32 }}>
            <p style={{ color: "#9A9A9A", marginBottom: 8 }}>No student reports yet.</p>
            <Link href={`/submit?course=${course.courseCode}`} style={{ color: "#B89A00", fontWeight: 600, fontSize: 14 }}>Be the first →</Link>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
          <div>

        {/* Grade Distribution */}
        {(() => {
          const allGrades = course.offerings.flatMap(o => (o as unknown as { gradeDistributions: { avgGpa: number; totalStudents: number; aPlus: number; a: number; aMinus: number; bPlus: number; b: number; bMinus: number; cPlus: number; c: number; cMinus: number; dPlus: number; d: number; dMinus: number; f: number; w: number }[] }).gradeDistributions || []);
          if (allGrades.length === 0) return null;
          const totals = allGrades.reduce((acc, g) => ({
            aPlus: acc.aPlus + g.aPlus, a: acc.a + g.a, aMinus: acc.aMinus + g.aMinus,
            bPlus: acc.bPlus + g.bPlus, b: acc.b + g.b, bMinus: acc.bMinus + g.bMinus,
            cPlus: acc.cPlus + g.cPlus, c: acc.c + g.c, cMinus: acc.cMinus + g.cMinus,
            dPlus: acc.dPlus + g.dPlus, d: acc.d + g.d, dMinus: acc.dMinus + g.dMinus,
            f: acc.f + g.f, w: acc.w + g.w, total: acc.total + g.totalStudents,
          }), { aPlus:0,a:0,aMinus:0,bPlus:0,b:0,bMinus:0,cPlus:0,c:0,cMinus:0,dPlus:0,d:0,dMinus:0,f:0,w:0,total:0 });
          const avgGpa = allGrades.reduce((sum, g) => sum + g.avgGpa * g.totalStudents, 0) / totals.total;
          const pct = (n: number) => totals.total > 0 ? ((n / totals.total) * 100).toFixed(1) : "0";
          const bars = [
            { label: "A", count: totals.aPlus + totals.a + totals.aMinus, color: "#15803D" },
            { label: "B", count: totals.bPlus + totals.b + totals.bMinus, color: "#65A30D" },
            { label: "C", count: totals.cPlus + totals.c + totals.cMinus, color: "#D97706" },
            { label: "D", count: totals.dPlus + totals.d + totals.dMinus, color: "#EA580C" },
            { label: "F", count: totals.f, color: "#E03A3E" },
            { label: "W", count: totals.w, color: "#9A9A9A" },
          ];
          const maxCount = Math.max(...bars.map(b => b.count));
          return (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #FFD200" }}>
                Grade Distribution
                <span style={{ fontSize: 12, fontWeight: 400, color: "#9A9A9A", marginLeft: 10 }}>via PlanetTerp · {totals.total.toLocaleString()} students</span>
              </h2>
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{ textAlign: "center", background: "#F3F0E6", borderRadius: 10, padding: "10px 20px" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A" }}>{avgGpa.toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: "#9A9A9A", textTransform: "uppercase", letterSpacing: "0.5px" }}>Avg GPA</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {bars.map(bar => (
                      <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, minWidth: 20, color: bar.color }}>{bar.label}</span>
                        <div style={{ flex: 1, background: "rgba(0,0,0,0.06)", borderRadius: 4, height: 20, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: bar.color, width: maxCount > 0 ? `${(bar.count / maxCount) * 100}%` : "0%", borderRadius: 4, transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: 12, color: "#9A9A9A", minWidth: 40, textAlign: "right" }}>{pct(bar.count)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

            {/* Professors */}
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #FFD200" }}>Professors</h2>
              {Array.from(profMap.values()).length === 0 ? (
                <p style={{ color: "#9A9A9A", fontSize: 14 }}>No professor data yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Array.from(profMap.values()).map(p => (
                    <Link key={p.id} href={`/professor/${p.id}`}>
                      <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, background: "#FFF9E0", border: "2px solid #FFD200", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            {p.fullName.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{p.fullName}</div>
                            <div style={{ fontSize: 12, color: "#9A9A9A" }}>{p.semesters.slice(0,3).join(" · ")}{p.semesters.length > 3 ? ` +${p.semesters.length-3}` : ""}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {p.avgRating !== null ? (<><Stars rating={p.avgRating} /><div style={{ fontSize: 11, color: "#9A9A9A", marginTop: 2 }}>{p.avgRating.toFixed(1)} · {p.reviewCount} reviews</div></>) : <span style={{ fontSize: 12, color: "#9A9A9A" }}>No ratings yet</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Exam History — always show all 6 slots */}
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #FFD200" }}>Exam Averages & History</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {examItems.map(({ label, num }) => {
                  const data = midtermData[num];
                  const hasData = data.records.length > 0;
                  const adminTopics = topicsByMidterm.get(num) || [];

                  return (
                    <div key={num} style={{ background: "white", border: `1px solid ${hasData ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.04)"}`, borderRadius: 12, overflow: "hidden" }}>
                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: hasData ? "white" : "#FAFAF7" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: hasData ? "#FFD200" : "#D1D5DB" }} />
                          <span style={{ fontSize: 15, fontWeight: 700, color: hasData ? "#1A1A1A" : "#9A9A9A" }}>{label}</span>
                        </div>
                        {hasData ? (
                          <div style={{ display: "flex", gap: 12 }}>
                            {data.avgScore !== null && (
                              <div style={{ textAlign: "center", background: "#F3F0E6", borderRadius: 8, padding: "6px 12px" }}>
                                <div style={{ fontSize: 16, fontWeight: 800 }}>{data.avgScore.toFixed(1)}%</div>
                                <div style={{ fontSize: 9, color: "#9A9A9A", textTransform: "uppercase", letterSpacing: "0.5px" }}>Class Avg</div>
                              </div>
                            )}
                            {data.avgDiff !== null && (
                              <div style={{ textAlign: "center", background: "#F3F0E6", borderRadius: 8, padding: "6px 12px" }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: diffColor(data.avgDiff) }}>{data.avgDiff.toFixed(1)}/10</div>
                                <div style={{ fontSize: 9, color: "#9A9A9A", textTransform: "uppercase", letterSpacing: "0.5px" }}>Difficulty</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#C0C0C0" }}>No data yet</span>
                        )}
                      </div>

                      {/* Details if data exists */}
                      {hasData && (
                        <div style={{ padding: "0 18px 14px" }}>
                          {/* Semester records */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                            {data.records.map(r => (
                              <span key={r.id} style={{ fontSize: 11, background: "#F3F0E6", padding: "3px 9px", borderRadius: 6, color: "#5A5A5A" }}>
                                {r.semester} {r.year}{r.avgScore ? ` · ${r.avgScore}%` : ""}
                              </span>
                            ))}
                          </div>
                          {/* Admin topics */}
                          {adminTopics.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#9A9A9A", letterSpacing: "0.8px", marginBottom: 6, textTransform: "uppercase" }}>Topics Covered</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {adminTopics.map(t => <span key={t.id} style={{ fontSize: 12, background: "#FFF9E0", border: "1px solid rgba(255,210,0,0.3)", color: "#92400E", padding: "3px 10px", borderRadius: 20 }}>{t.topic}</span>)}
                              </div>
                            </div>
                          )}
                          {/* Student-submitted topics */}
                          {data.topTopics.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#9A9A9A", letterSpacing: "0.8px", marginBottom: 6, textTransform: "uppercase" }}>Student-Reported Topics</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {data.topTopics.map(([t, c]) => <span key={t} style={{ fontSize: 12, background: "#F3F0E6", color: "#5A5A5A", padding: "3px 10px", borderRadius: 20 }}>{t}{c > 1 ? ` (${c}x)` : ""}</span>)}
                              </div>
                            </div>
                          )}
                          {/* Tips */}
                          {data.tips.length > 0 && data.tips.map((tip, i) => (
                            <div key={i} style={{ fontSize: 13, color: "#5A5A5A", padding: "7px 12px", background: "#F3F0E6", borderRadius: 8, marginBottom: 6, lineHeight: 1.5 }}>"{tip}"</div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Survival Tips */}
            {tips.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #FFD200" }}>Survival Tips</h2>
                {tips.map((tip, i) => <div key={i} style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "14px 18px", fontSize: 14, color: "#5A5A5A", lineHeight: 1.6, marginBottom: 8 }}>"{tip}"</div>)}
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* General course topics */}
            {generalTopics.length > 0 && (
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 18, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Course Material</h3>
                {generalTopics.map(t => (
                  <div key={t.id} style={{ fontSize: 13, color: "#5A5A5A", padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between" }}>
                    <span>{t.topic}</span>
                    {t.frequency > 1 && <span style={{ fontSize: 11, color: "#9A9A9A" }}>{t.frequency}x</span>}
                  </div>
                ))}
              </div>
            )}

           

            {/* Resources link */}
            <Link href={`/resources/${course.courseCode}`} style={{ display: "block", background: "white", border: "2px solid #FFD200", borderRadius: 12, padding: 18, marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>📚</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>Study Resources</div>
              <div style={{ fontSize: 12, color: "#9A9A9A" }}>Videos, textbooks, courses & more</div>
            </Link>

            {/* Gen-Eds */}
            {course.genEd && course.genEd.length > 0 && (
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 18, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Gen-Ed Requirements</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {course.genEd.map((g: string) => (
                    <span key={g} style={{ fontSize: 12, fontWeight: 700, background: "#E0F2FE", color: "#0369A1", padding: "4px 10px", borderRadius: 20 }}>{g}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {course.prereq && (course.prereq.prereqs || course.prereq.coreqs || course.prereq.restrictions) && (
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 18, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Requirements</h3>
                {course.prereq.prereqs && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9A9A9A", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>Prerequisites</div>
                    <p style={{ fontSize: 13, color: "#5A5A5A", lineHeight: 1.5 }}>{course.prereq.prereqs}</p>
                  </div>
                )}
                {course.prereq.coreqs && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9A9A9A", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>Corequisites</div>
                    <p style={{ fontSize: 13, color: "#5A5A5A", lineHeight: 1.5 }}>{course.prereq.coreqs}</p>
                  </div>
                )}
                {course.prereq.restrictions && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9A9A9A", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>Restrictions</div>
                    <p style={{ fontSize: 13, color: "#5A5A5A", lineHeight: 1.5 }}>{course.prereq.restrictions}</p>
                  </div>
                )}
              </div>
            )}

            <div style={{ background: "#1A1A1A", borderRadius: 12, padding: 18 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 6 }}>Took this course?</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14, lineHeight: 1.5 }}>Share your experience and help future Terps.</p>
              <Link href={`/submit?course=${course.courseCode}`} style={{ display: "block", textAlign: "center", background: "#FFD200", color: "#1A1A1A", fontWeight: 700, fontSize: 13, padding: "10px 0", borderRadius: 8 }}>Submit a Report</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
