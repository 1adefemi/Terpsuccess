"use client";
import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";

type Report = { id: string; overallDifficulty: number; weeklyWorkloadHours: number; assignmentCount: number; midtermCount: number; midtermAverage: number | null; classType: string; tipText: string | null; createdAt: Date; offering: { semester: string; year: number; course: { courseCode: string; title: string }; professor: { fullName: string } } };
type Review = { id: string; rating: number; comment: string | null; courseCode: string; semester: string; year: number; createdAt: Date; professor: { fullName: string } };
type Stats = { pendingReports: number; pendingReviews: number; totalReports: number; totalReviews: number };

export default function AdminClient({ pendingReports, pendingReviews, stats }: { pendingReports: Report[]; pendingReviews: Review[]; stats: Stats }) {
  const [reports, setReports] = useState(pendingReports);
  const [reviews, setReviews] = useState(pendingReviews);
  const [tab, setTab] = useState<"reports"|"reviews">("reports");
  const [processing, setProcessing] = useState<string | null>(null);

  const handle = async (id: string, status: "APPROVED"|"REJECTED", type: "report"|"review") => {
    setProcessing(id);
    await fetch("/api/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId: id, status, type }) });
    if (type === "report") setReports(p => p.filter(r => r.id !== id));
    else setReviews(p => p.filter(r => r.id !== id));
    setProcessing(null);
  };

  const statCards = [
    { label: "Pending Reports", value: reports.length, color: "#D97706" },
    { label: "Pending Reviews", value: reviews.length, color: "#D97706" },
    { label: "Live Reports", value: stats.totalReports, color: "#15803D" },
    { label: "Live Reviews", value: stats.totalReviews, color: "#15803D" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#FAFAF7" }}>
      <Nav />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 32px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Admin Panel</h1>
        <p style={{ color: "#9A9A9A", marginBottom: 32, fontSize: 14 }}>Review and approve submitted reports and professor reviews.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 32 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "14px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 0, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)", width: "fit-content", marginBottom: 24 }}>
          {(["reports","reviews"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 24px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: tab === t ? "#1A1A1A" : "white", color: tab === t ? "#FFD200" : "#5A5A5A", textTransform: "capitalize" }}>{t}</button>
          ))}
        </div>

        {tab === "reports" && (
          reports.length === 0 ? <div style={{ textAlign: "center", padding: "60px 0", color: "#9A9A9A" }}>All caught up! ✅</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reports.map(r => (
                <div key={r.id} style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#E03A3E", marginRight: 8 }}>{r.offering.course.courseCode}</span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{r.offering.course.title}</span>
                      <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 2 }}>{r.offering.professor.fullName} · {r.offering.semester} {r.offering.year}</div>
                    </div>
                    <span style={{ fontSize: 11, color: "#9A9A9A" }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 12 }}>
                    {[["Difficulty", `${r.overallDifficulty}/10`], ["Workload", `${r.weeklyWorkloadHours} hrs/wk`], ["Assignments", r.assignmentCount], ["Midterms", r.midtermCount]].map(([l,v]) => (
                      <div key={l as string} style={{ background: "#F3F0E6", borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontSize: 10, color: "#9A9A9A", marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {r.tipText && <div style={{ fontSize: 13, color: "#5A5A5A", background: "#F3F0E6", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>"{r.tipText}"</div>}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => handle(r.id, "APPROVED", "report")} disabled={processing === r.id} style={{ flex: 1, background: "#DCFCE7", border: "1px solid #86EFAC", color: "#15803D", fontWeight: 700, padding: "9px 0", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>✓ Approve</button>
                    <button onClick={() => handle(r.id, "REJECTED", "report")} disabled={processing === r.id} style={{ flex: 1, background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#991B1B", fontWeight: 700, padding: "9px 0", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>✗ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "reviews" && (
          reviews.length === 0 ? <div style={{ textAlign: "center", padding: "60px 0", color: "#9A9A9A" }}>All caught up! ✅</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{r.professor.fullName}</div>
                      <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 2 }}>{r.courseCode} · {r.semester} {r.year}</div>
                    </div>
                    <div style={{ display: "flex", gap: 1 }}>{[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 18, color: i <= r.rating ? "#FFD200" : "#D1D5DB" }}>★</span>)}</div>
                  </div>
                  {r.comment && <div style={{ fontSize: 13, color: "#5A5A5A", background: "#F3F0E6", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>"{r.comment}"</div>}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => handle(r.id, "APPROVED", "review")} disabled={processing === r.id} style={{ flex: 1, background: "#DCFCE7", border: "1px solid #86EFAC", color: "#15803D", fontWeight: 700, padding: "9px 0", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>✓ Approve</button>
                    <button onClick={() => handle(r.id, "REJECTED", "review")} disabled={processing === r.id} style={{ flex: 1, background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#991B1B", fontWeight: 700, padding: "9px 0", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>✗ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </main>
  );
}
