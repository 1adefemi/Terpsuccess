"use client";
import { useState } from "react";
import Link from "next/link";

type Resource = {
  id: string;
  type: "YOUTUBE" | "TEXTBOOK" | "ONLINE_COURSE" | "FLASHCARDS" | "WEBSITE";
  title: string;
  url: string;
  description?: string | null;
  topic?: string | null;
  upvotes: number;
};

const TYPE_META = {
  YOUTUBE: { label: "YouTube", emoji: "▶️", color: "#CC0000", bg: "#FFF0F0" },
  TEXTBOOK: { label: "Textbook", emoji: "📚", color: "#1A1A1A", bg: "#F3F0E6" },
  ONLINE_COURSE: { label: "Online Course", emoji: "🎓", color: "#7C3AED", bg: "#F5F3FF" },
  FLASHCARDS: { label: "Flashcards", emoji: "🃏", color: "#D97706", bg: "#FEF3C7" },
  WEBSITE: { label: "Website / Docs", emoji: "🌐", color: "#0369A1", bg: "#E0F2FE" },
};

const ALL_TYPES = Object.keys(TYPE_META) as (keyof typeof TYPE_META)[];

function ResourceCard({ resource, onUpvote }: { resource: Resource; onUpvote: (id: string) => void }) {
  const meta = TYPE_META[resource.type];
  return (
    <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 18, display: "flex", gap: 14 }}>
      <div style={{ width: 44, height: 44, background: meta.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
        {meta.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <a href={resource.url} target="_blank" rel="noreferrer"
            style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.3 }}
            onMouseEnter={e => (e.currentTarget.style.color = "#B89A00")}
            onMouseLeave={e => (e.currentTarget.style.color = "#1A1A1A")}>
            {resource.title} ↗
          </a>
          <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, background: meta.bg, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>
            {meta.label}
          </span>
        </div>
        {resource.topic && (
          <span style={{ fontSize: 11, background: "#FFF9E0", border: "1px solid rgba(255,210,0,0.3)", color: "#92400E", padding: "2px 8px", borderRadius: 20, display: "inline-block", marginBottom: 8 }}>
            📌 {resource.topic}
          </span>
        )}
        {resource.description && (
          <p style={{ fontSize: 13, color: "#5A5A5A", lineHeight: 1.5, margin: "0 0 10px" }}>{resource.description}</p>
        )}
        <button onClick={() => onUpvote(resource.id)}
          style={{ fontSize: 12, color: "#9A9A9A", background: "none", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
          👍 {resource.upvotes} found this helpful
        </button>
      </div>
    </div>
  );
}

function SubmitForm({ courseCode, onSubmitted }: { courseCode: string; onSubmitted: (r: Resource) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "YOUTUBE", title: "", url: "", description: "", topic: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.url) return;
    setSubmitting(true); setError("");
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseCode, ...form }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => { setDone(false); setOpen(false); setForm({ type: "YOUTUBE", title: "", url: "", description: "", topic: "" }); }, 2500);
    } else {
      setError(data.error || "Something went wrong");
    }
  };

  const inp = { width: "100%", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, padding: "9px 14px", fontSize: 14, outline: "none" } as React.CSSProperties;

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ background: "#FFD200", color: "#1A1A1A", fontWeight: 700, fontSize: 14, padding: "10px 22px", borderRadius: 10, border: "none", cursor: "pointer" }}>
      + Submit a Resource
    </button>
  );

  return (
    <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 22, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Submit a Study Resource</h3>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#9A9A9A", lineHeight: 1 }}>×</button>
      </div>

      {done ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
          <p style={{ fontWeight: 700, color: "#15803D" }}>Submitted for review!</p>
          <p style={{ fontSize: 13, color: "#9A9A9A", marginTop: 4 }}>Goes live once approved. Thank you!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Resource Type *</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ALL_TYPES.map(t => (
                <button key={t} type="button" onClick={() => set("type", t)}
                  style={{ padding: "7px 14px", borderRadius: 8, border: `2px solid ${form.type===t?"#FFD200":"rgba(0,0,0,0.1)"}`, background: form.type===t?"#FFF9E0":"white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {TYPE_META[t].emoji} {TYPE_META[t].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Title *</div>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. MIT OpenCourseWare — Algorithms Lecture 1" style={inp} />
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>URL *</div>
            <input value={form.url} onChange={e => set("url", e.target.value)} placeholder="https://..." style={inp} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Topic (optional)</div>
              <input value={form.topic} onChange={e => set("topic", e.target.value)} placeholder="e.g. Sorting Algorithms" style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Why is this helpful?</div>
              <input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Short description..." style={inp} />
            </div>
          </div>

          {error && <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#991B1B", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button onClick={() => setOpen(false)} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "white", cursor: "pointer", fontSize: 14 }}>Cancel</button>
            <button onClick={handleSubmit} disabled={submitting || !form.title || !form.url}
              style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#1A1A1A", color: "#FFD200", fontWeight: 700, cursor: "pointer", fontSize: 14, opacity: (!form.title||!form.url) ? 0.5 : 1 }}>
              {submitting ? "Submitting..." : "Submit for Review"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResourcesClient({ courseCode, initialResources, topics }: {
  courseCode: string;
  initialResources: Resource[];
  topics: string[];
}) {
  const [resources, setResources] = useState(initialResources);
  const [activeType, setActiveType] = useState("ALL");
  const [activeTopic, setActiveTopic] = useState("ALL");

  const handleUpvote = async (id: string) => {
    await fetch("/api/resources", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resourceId: id, action: "upvote" }) });
    setResources(prev => prev.map(r => r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r));
  };

  const allTopics = Array.from(new Set(resources.filter(r => r.topic).map(r => r.topic!)));

  const filtered = resources.filter(r =>
    (activeType === "ALL" || r.type === activeType) &&
    (activeTopic === "ALL" || r.topic === activeTopic)
  );

  const grouped = ALL_TYPES.reduce((acc, t) => {
    const items = filtered.filter(r => r.type === t);
    if (items.length > 0) acc[t] = items;
    return acc;
  }, {} as Record<string, Resource[]>);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px" }}>
      {/* Submit form */}
      <SubmitForm courseCode={courseCode} onSubmitted={() => {}} />

      {/* Type filter pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={() => setActiveType("ALL")} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${activeType==="ALL"?"#1A1A1A":"rgba(0,0,0,0.1)"}`, fontSize: 12, fontWeight: 600, cursor: "pointer", background: activeType==="ALL"?"#1A1A1A":"white", color: activeType==="ALL"?"#FFD200":"#5A5A5A" }}>
          All ({resources.length})
        </button>
        {ALL_TYPES.filter(t => resources.some(r => r.type === t)).map(t => (
          <button key={t} onClick={() => setActiveType(activeType===t?"ALL":t)}
            style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${activeType===t?TYPE_META[t].color:"rgba(0,0,0,0.1)"}`, fontSize: 12, fontWeight: 600, cursor: "pointer", background: activeType===t?TYPE_META[t].bg:"white", color: activeType===t?TYPE_META[t].color:"#5A5A5A" }}>
            {TYPE_META[t].emoji} {TYPE_META[t].label} ({resources.filter(r=>r.type===t).length})
          </button>
        ))}
      </div>

      {/* Topic filter */}
      {allTopics.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#9A9A9A" }}>Topic:</span>
          <button onClick={() => setActiveTopic("ALL")} style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${activeTopic==="ALL"?"#FFD200":"rgba(0,0,0,0.1)"}`, fontSize: 12, fontWeight: activeTopic==="ALL"?700:400, cursor: "pointer", background: activeTopic==="ALL"?"#FFF9E0":"white", color: activeTopic==="ALL"?"#92400E":"#5A5A5A" }}>
            All Topics
          </button>
          {allTopics.map(t => (
            <button key={t} onClick={() => setActiveTopic(activeTopic===t?"ALL":t)}
              style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${activeTopic===t?"#FFD200":"rgba(0,0,0,0.1)"}`, fontSize: 12, fontWeight: activeTopic===t?700:400, cursor: "pointer", background: activeTopic===t?"#FFF9E0":"white", color: activeTopic===t?"#92400E":"#5A5A5A" }}>
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Resources */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <p style={{ color: "#9A9A9A", fontSize: 16, marginBottom: 8 }}>No resources yet for {courseCode}.</p>
          <p style={{ color: "#9A9A9A", fontSize: 14 }}>Be the first to submit a helpful video, textbook, or course!</p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <div key={type} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid #FFD200", display: "flex", alignItems: "center", gap: 8 }}>
              <span>{TYPE_META[type as keyof typeof TYPE_META].emoji}</span>
              <span>{TYPE_META[type as keyof typeof TYPE_META].label}</span>
              <span style={{ fontSize: 12, color: "#9A9A9A", fontWeight: 400 }}>({items.length})</span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map(r => <ResourceCard key={r.id} resource={r} onUpvote={handleUpvote} />)}
            </div>
          </div>
        ))
      )}

      <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <Link href={`/course/${courseCode}`} style={{ fontSize: 14, color: "#B89A00", fontWeight: 600 }}>← Back to {courseCode} course page</Link>
      </div>
    </div>
  );
}
