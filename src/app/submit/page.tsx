"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";

const SEMESTERS = ["FALL","SPRING","SUMMER","WINTER"];
const YEAR = new Date().getFullYear();
const YEARS = [YEAR, YEAR-1, YEAR-2];

// Autocomplete input
function AutocompleteInput({ value, onChange, fetchUrl, placeholder, renderItem, onSelect }: {
  value: string; onChange: (v: string) => void; fetchUrl: (q: string) => string;
  placeholder: string; renderItem: (item: Record<string, string>) => React.ReactNode;
  onSelect: (item: Record<string, string>) => void;
}) {
  const [results, setResults] = useState<Record<string, string>[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length < 2) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(fetchUrl(value));
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch { setOpen(false); }
    }, 180);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input value={value} onChange={e => onChange(e.target.value)} onFocus={() => value.length >= 2 && results.length > 0 && setOpen(true)}
        placeholder={placeholder} style={{ width: "100%", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none" }} />
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 200, overflow: "hidden", maxHeight: 220, overflowY: "auto" }}>
          {results.map((item, i) => (
            <div key={i} onClick={() => { onSelect(item); setOpen(false); }}
              style={{ padding: "10px 14px", borderTop: i > 0 ? "1px solid rgba(0,0,0,0.04)" : "none", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#FAFAF7")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Label({ text }: { text: string }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{text}</div>;
}

function DiffSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const color = value >= 8 ? "#E03A3E" : value >= 5 ? "#D97706" : "#15803D";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#9A9A9A" }}>Easy</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}/10</span>
        <span style={{ fontSize: 11, color: "#9A9A9A" }}>Hard</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(parseInt(e.target.value))} style={{ width: "100%" }} />
    </div>
  );
}

type Assignment = { name: string; difficulty: number };
type GradingItem = { label: string; weight: number };
type WeeklyTopic = { week: number; topic: string };

function AssignmentList({ title, items, onAdd, onRemove, onUpdate, addLabel }: {
  title: string; items: Assignment[]; onAdd: () => void;
  onRemove: (i: number) => void; onUpdate: (i: number, f: keyof Assignment, v: string | number) => void; addLabel: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Label text={title} />
        <button type="button" onClick={onAdd} style={{ fontSize: 12, fontWeight: 700, color: "#B89A00", background: "#FFF9E0", border: "1px solid rgba(255,210,0,0.3)", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>+ {addLabel}</button>
      </div>
      {items.length === 0 && <p style={{ fontSize: 13, color: "#9A9A9A", fontStyle: "italic" }}>None added yet</p>}
      {items.map((item, i) => (
        <div key={i} style={{ background: "#FAFAF7", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: 14, marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <input value={item.name} onChange={e => onUpdate(i, "name", e.target.value)} placeholder={`${addLabel} name`}
              style={{ flex: 1, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }} />
            <button type="button" onClick={() => onRemove(i)} style={{ color: "#E03A3E", background: "none", border: "none", cursor: "pointer", fontSize: 20, fontWeight: 700, lineHeight: 1 }}>×</button>
          </div>
          <DiffSlider value={item.difficulty} onChange={v => onUpdate(i, "difficulty", v)} />
        </div>
      ))}
    </div>
  );
}

function SubmitContent() {
  const params = useSearchParams();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    courseCode: params.get("course") || "",
    professorName: "",
    semester: "FALL",
    year: YEAR,
    weeklyWorkloadHours: 8,
    classType: "BALANCED" as "EXAM_HEAVY"|"PROJECT_HEAVY"|"BALANCED",
    tipText: "",
    // Exams
    midterm1: false, midterm1Avg: "", midterm1Diff: 5,
    midterm2: false, midterm2Avg: "", midterm2Diff: 5,
    midterm3: false, midterm3Avg: "", midterm3Diff: 5,
    midterm4: false, midterm4Avg: "", midterm4Diff: 5,
    midterm5: false, midterm5Avg: "", midterm5Diff: 5,
    hasFinal: false, finalAvg: "", finalDiff: 5,
    // Professor
    professorRating: 0,
    professorComment: "",
    // Syllabus
    textbook: "",
    cutoffA: "90", cutoffB: "80", cutoffC: "70", cutoffD: "60",
    hasCurve: false, curvePolicy: "",
    latePolicy: "", attendancePolicy: "", extraCreditPolicy: "",
  });

  const [projects, setProjects] = useState<Assignment[]>([]);
  const [labs, setLabs] = useState<Assignment[]>([]);
  const [homeworks, setHomeworks] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Assignment[]>([]);
  const [gradingBreakdown, setGradingBreakdown] = useState<GradingItem[]>([]);
  const [weeklyTopics, setWeeklyTopics] = useState<WeeklyTopic[]>([]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const addAssignment = (setter: React.Dispatch<React.SetStateAction<Assignment[]>>, name: string) =>
    setter(p => [...p, { name: `${name} ${p.length + 1}`, difficulty: 5 }]);
  const removeAssignment = (setter: React.Dispatch<React.SetStateAction<Assignment[]>>, i: number) =>
    setter(p => p.filter((_, idx) => idx !== i));
  const updateAssignment = (setter: React.Dispatch<React.SetStateAction<Assignment[]>>, i: number, f: keyof Assignment, v: string | number) =>
    setter(p => p.map((item, idx) => idx === i ? { ...item, [f]: v } : item));

  const midtermCount = [form.midterm1,form.midterm2,form.midterm3,form.midterm4,form.midterm5].filter(Boolean).length;

  const totalGradingWeight = gradingBreakdown.reduce((sum, item) => sum + (item.weight || 0), 0);

  const handleSubmit = async () => {
    setSubmitting(true); setError("");

    // Submit course report
    const reportRes = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseCode: form.courseCode, professorName: form.professorName,
        semester: form.semester, year: form.year,
        overallDifficulty: form.midterm1 ? form.midterm1Diff : 5,
        weeklyWorkloadHours: form.weeklyWorkloadHours,
        assignmentCount: projects.length + labs.length + homeworks.length + quizzes.length,
        midtermCount,
        midtermAverage: form.midterm1 && form.midterm1Avg ? parseFloat(form.midterm1Avg) : undefined,
        midtermDifficulty: form.midterm1 ? form.midterm1Diff : undefined,
        finalAverage: form.hasFinal && form.finalAvg ? parseFloat(form.finalAvg) : undefined,
        finalDifficulty: form.hasFinal ? form.finalDiff : undefined,
        projectCount: projects.length,
        projectDifficulty: projects.length > 0 ? Math.round(projects.reduce((a,b) => a+b.difficulty,0)/projects.length) : undefined,
        labCount: labs.length,
        labDifficulty: labs.length > 0 ? Math.round(labs.reduce((a,b) => a+b.difficulty,0)/labs.length) : undefined,
        hwCount: homeworks.length,
        hwDifficulty: homeworks.length > 0 ? Math.round(homeworks.reduce((a,b) => a+b.difficulty,0)/homeworks.length) : undefined,
        quizCount: quizzes.length,
        quizDifficulty: quizzes.length > 0 ? Math.round(quizzes.reduce((a,b) => a+b.difficulty,0)/quizzes.length) : undefined,
        classType: form.classType, tipText: form.tipText || undefined,
        professorRating: form.professorRating > 0 ? form.professorRating : undefined,
        professorComment: form.professorComment || undefined,
      }),
    });
    const reportData = await reportRes.json();
    if (!reportRes.ok) { setSubmitting(false); setError(reportData.error || "Something went wrong."); return; }

    // Submit syllabus data if any was filled in
    const hasSyllabusData = gradingBreakdown.length > 0 || weeklyTopics.length > 0 || form.textbook || form.cutoffA;
    if (hasSyllabusData) {
      await fetch("/api/syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: form.courseCode, professorName: form.professorName,
          semester: form.semester, year: form.year,
          gradingBreakdown: gradingBreakdown.length > 0 ? gradingBreakdown : undefined,
          cutoffA: form.cutoffA, cutoffB: form.cutoffB, cutoffC: form.cutoffC, cutoffD: form.cutoffD,
          hasCurve: form.hasCurve, curvePolicy: form.curvePolicy || undefined,
          textbook: form.textbook || undefined,
          weeklyTopics: weeklyTopics.length > 0 ? weeklyTopics : undefined,
          latePolicy: form.latePolicy || undefined,
          attendancePolicy: form.attendancePolicy || undefined,
          extraCreditPolicy: form.extraCreditPolicy || undefined,
        }),
      });
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <main style={{ minHeight: "100vh", background: "#FAFAF7" }}><Nav />
      <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 32px" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Report Submitted!</h2>
        <p style={{ color: "#5A5A5A", marginBottom: 24 }}>Under review — thank you for helping fellow Terps!</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/" style={{ background: "#1A1A1A", color: "#FFD200", fontWeight: 700, padding: "12px 24px", borderRadius: 10, fontSize: 14 }}>Home</Link>
          <button onClick={() => { setSubmitted(false); setStep(1); setProjects([]); setLabs([]); setHomeworks([]); setQuizzes([]); setGradingBreakdown([]); setWeeklyTopics([]); }} style={{ background: "#FFD200", color: "#1A1A1A", fontWeight: 700, padding: "12px 24px", borderRadius: 10, fontSize: 14, border: "none", cursor: "pointer" }}>Submit Another</button>
        </div>
      </div>
    </main>
  );

  const steps = ["Course Info", "Exams", "Assignments", "Syllabus Info", "Other & Tips", "Rate Professor"];
  const inp = { width: "100%", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none" } as React.CSSProperties;
  const card = { background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 20, marginBottom: 12 } as React.CSSProperties;

  return (
    <main style={{ minHeight: "100vh", background: "#FAFAF7" }}>
      <Nav />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Submit a Report</h1>
        <p style={{ color: "#9A9A9A", marginBottom: 28, fontSize: 14 }}>Anonymous · Helps hundreds of Terps</p>

        {/* Step bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, overflowX: "auto", paddingBottom: 4 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: i+1 <= step ? "#FFD200" : "rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: i+1 <= step ? "#1A1A1A" : "#9A9A9A", flexShrink: 0 }}>{i+1}</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: i+1 === step ? "#1A1A1A" : "#9A9A9A", whiteSpace: "nowrap" }}>{s}</span>
              </div>
              {i < steps.length-1 && <div style={{ width: 16, height: 2, background: i+1 < step ? "#FFD200" : "rgba(0,0,0,0.08)", flexShrink: 0 }} />}
            </div>
          ))}
        </div>

        {/* Step 1: Course Info */}
        {step === 1 && (
          <div style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <Label text="Course Code *" />
                <AutocompleteInput value={form.courseCode} onChange={v => set("courseCode", v.toUpperCase())}
                  fetchUrl={q => `/api/courses?q=${encodeURIComponent(q)}&limit=8`} placeholder="e.g. CMSC351"
                  renderItem={item => <div style={{ display: "flex", gap: 10 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#E03A3E", minWidth: 64 }}>{item.courseCode}</span><span style={{ fontSize: 13 }}>{item.title}</span></div>}
                  onSelect={item => set("courseCode", item.courseCode)} />
              </div>
              <div>
                <Label text="Professor *" />
                <AutocompleteInput value={form.professorName} onChange={v => set("professorName", v)}
                  fetchUrl={q => `/api/professors?q=${encodeURIComponent(q)}`} placeholder="Professor's full name"
                  renderItem={item => <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 24, height: 24, background: "#FFF9E0", border: "2px solid #FFD200", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>{item.fullName.split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase()}</div><span style={{ fontSize: 13 }}>{item.fullName}</span></div>}
                  onSelect={item => set("professorName", item.fullName)} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div><Label text="Semester *" /><select value={form.semester} onChange={e => set("semester", e.target.value)} style={inp}>{SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><Label text="Year *" /><select value={form.year} onChange={e => set("year", parseInt(e.target.value))} style={inp}>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><Label text="Weekly Workload" /><span style={{ fontSize: 13, fontWeight: 700 }}>{form.weeklyWorkloadHours} hrs/week</span></div>
              <input type="range" min={0} max={40} step={0.5} value={form.weeklyWorkloadHours} onChange={e => set("weeklyWorkloadHours", parseFloat(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div><Label text="Class Type *" />
              <div style={{ display: "flex", gap: 8 }}>
                {(["EXAM_HEAVY","PROJECT_HEAVY","BALANCED"] as const).map(t => (
                  <button key={t} type="button" onClick={() => set("classType", t)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `2px solid ${form.classType===t?"#FFD200":"rgba(0,0,0,0.1)"}`, background: form.classType===t?"#FFF9E0":"white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t.replace("_"," ").toLowerCase()}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Exams */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: 13, color: "#5A5A5A", marginBottom: 16, background: "#FFF9E0", padding: "10px 14px", borderRadius: 8, borderLeft: "3px solid #FFD200" }}>Check each exam this course had. Leave unchecked if it didn't exist.</p>
            {[1,2,3,4,5].map(n => {
              const has = form[`midterm${n}` as keyof typeof form] as boolean;
              const avg = form[`midterm${n}Avg` as keyof typeof form] as string;
              const diff = form[`midterm${n}Diff` as keyof typeof form] as number;
              return (
                <div key={n} style={{ background: "white", border: `1px solid ${has?"#FFD200":"rgba(0,0,0,0.08)"}`, borderRadius: 12, padding: 16, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: has ? 16 : 0 }}>
                    <input type="checkbox" checked={has} onChange={e => set(`midterm${n}`, e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#FFD200" }} />
                    <span style={{ fontSize: 15, fontWeight: 700 }}>Midterm {n}</span>
                    {!has && <span style={{ fontSize: 12, color: "#9A9A9A", marginLeft: "auto" }}>Not in this course</span>}
                  </div>
                  {has && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div><Label text="Class Average (%)" /><input type="number" min={0} max={100} value={avg} onChange={e => set(`midterm${n}Avg`, e.target.value)} placeholder="e.g. 68" style={inp} /></div>
                      <div><Label text="Difficulty" /><DiffSlider value={diff} onChange={v => set(`midterm${n}Diff`, v)} /></div>
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ background: "white", border: `1px solid ${form.hasFinal?"#FFD200":"rgba(0,0,0,0.08)"}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: form.hasFinal ? 16 : 0 }}>
                <input type="checkbox" checked={form.hasFinal} onChange={e => set("hasFinal", e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#FFD200" }} />
                <span style={{ fontSize: 15, fontWeight: 700 }}>Final Exam</span>
                {!form.hasFinal && <span style={{ fontSize: 12, color: "#9A9A9A", marginLeft: "auto" }}>No final</span>}
              </div>
              {form.hasFinal && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><Label text="Class Average (%)" /><input type="number" min={0} max={100} value={form.finalAvg} onChange={e => set("finalAvg", e.target.value)} placeholder="e.g. 72" style={inp} /></div>
                  <div><Label text="Difficulty" /><DiffSlider value={form.finalDiff} onChange={v => set("finalDiff", v)} /></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Assignments */}
        {step === 3 && (
          <div style={card}>
            <p style={{ fontSize: 13, color: "#5A5A5A", marginBottom: 20, background: "#FFF9E0", padding: "10px 14px", borderRadius: 8, borderLeft: "3px solid #FFD200" }}>Add each assignment individually with its own difficulty rating.</p>
            <AssignmentList title="Projects" items={projects} onAdd={() => addAssignment(setProjects, "Project")} onRemove={i => removeAssignment(setProjects, i)} onUpdate={(i,f,v) => updateAssignment(setProjects,i,f,v)} addLabel="Project" />
            <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "16px 0" }} />
            <AssignmentList title="Labs" items={labs} onAdd={() => addAssignment(setLabs, "Lab")} onRemove={i => removeAssignment(setLabs, i)} onUpdate={(i,f,v) => updateAssignment(setLabs,i,f,v)} addLabel="Lab" />
          </div>
        )}

        {/* Step 4: Syllabus Info */}
        {step === 4 && (
          <div>
            <p style={{ fontSize: 13, color: "#5A5A5A", marginBottom: 16, background: "#FFF9E0", padding: "10px 14px", borderRadius: 8, borderLeft: "3px solid #FFD200" }}>
              All fields optional — share what you remember from the syllabus. Facts only, no copying.
            </p>

            {/* Grading Breakdown */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>📊 Grading Breakdown</h3>
                <button type="button" onClick={() => setGradingBreakdown(p => [...p, { label: "", weight: 0 }])}
                  style={{ fontSize: 12, fontWeight: 700, color: "#B89A00", background: "#FFF9E0", border: "1px solid rgba(255,210,0,0.3)", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>
                  + Add Item
                </button>
              </div>
              {gradingBreakdown.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9A9A9A", fontStyle: "italic" }}>e.g. Midterm 1 = 20%, Final = 30%, Homework = 20%</p>
              ) : (
                <>
                  {gradingBreakdown.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      <input value={item.label} onChange={e => setGradingBreakdown(p => p.map((x, idx) => idx===i?{...x,label:e.target.value}:x))}
                        placeholder="e.g. Midterm 1, Final, Homework" style={{ flex: 2, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }} />
                      <input type="number" min={0} max={100} value={item.weight} onChange={e => setGradingBreakdown(p => p.map((x, idx) => idx===i?{...x,weight:parseInt(e.target.value)||0}:x))}
                        placeholder="%" style={{ width: 70, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }} />
                      <span style={{ fontSize: 12, color: "#9A9A9A" }}>%</span>
                      <button type="button" onClick={() => setGradingBreakdown(p => p.filter((_,idx) => idx!==i))} style={{ color: "#E03A3E", background: "none", border: "none", cursor: "pointer", fontSize: 18, fontWeight: 700 }}>×</button>
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: totalGradingWeight === 100 ? "#15803D" : "#E03A3E", fontWeight: 600, marginTop: 8 }}>
                    Total: {totalGradingWeight}% {totalGradingWeight === 100 ? "✓" : "(should equal 100%)"}
                  </div>
                </>
              )}
            </div>

            {/* Grade Cutoffs */}
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🔤 Letter Grade Cutoffs</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 12 }}>
                {[["A","cutoffA","#15803D"],["B","cutoffB","#65A30D"],["C","cutoffC","#D97706"],["D","cutoffD","#EA580C"]].map(([letter, key, color]) => (
                  <div key={letter} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color, marginBottom: 6 }}>{letter}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input type="number" min={0} max={100} value={form[key as keyof typeof form] as string}
                        onChange={e => set(key, e.target.value)}
                        style={{ width: "100%", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", textAlign: "center" }} />
                      <span style={{ fontSize: 12, color: "#9A9A9A", flexShrink: 0 }}>%+</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: form.hasCurve ? 10 : 0 }}>
                <input type="checkbox" checked={form.hasCurve} onChange={e => set("hasCurve", e.target.checked)} style={{ width: 16, height: 16, accentColor: "#FFD200" }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>This course has a curve</span>
              </div>
              {form.hasCurve && <input value={form.curvePolicy} onChange={e => set("curvePolicy", e.target.value)} placeholder="Describe the curve (e.g. curved to 75% median)" style={{ ...inp, marginTop: 8 }} />}
            </div>

            {/* Weekly Topics */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>📅 Weekly Topics</h3>
                <button type="button" onClick={() => setWeeklyTopics(p => [...p, { week: p.length + 1, topic: "" }])}
                  style={{ fontSize: 12, fontWeight: 700, color: "#B89A00", background: "#FFF9E0", border: "1px solid rgba(255,210,0,0.3)", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>
                  + Add Week
                </button>
              </div>
              {weeklyTopics.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9A9A9A", fontStyle: "italic" }}>e.g. Week 1: Intro to Sorting, Week 2: Binary Search Trees...</p>
              ) : (
                weeklyTopics.map((wt, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#9A9A9A", minWidth: 50 }}>Wk {wt.week}</span>
                    <input value={wt.topic} onChange={e => setWeeklyTopics(p => p.map((x,idx) => idx===i?{...x,topic:e.target.value}:x))}
                      placeholder="Topic covered this week"
                      style={{ flex: 1, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }} />
                    <button type="button" onClick={() => setWeeklyTopics(p => p.filter((_,idx) => idx!==i))} style={{ color: "#E03A3E", background: "none", border: "none", cursor: "pointer", fontSize: 18, fontWeight: 700 }}>×</button>
                  </div>
                ))
              )}
            </div>

            {/* Textbook */}
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>📖 Textbook & Policies</h3>
              <div style={{ marginBottom: 12 }}><Label text="Textbook Used" /><input value={form.textbook} onChange={e => set("textbook", e.target.value)} placeholder="e.g. CLRS Introduction to Algorithms, 4th ed." style={inp} /></div>
              <div style={{ marginBottom: 12 }}><Label text="Late Policy" /><input value={form.latePolicy} onChange={e => set("latePolicy", e.target.value)} placeholder="e.g. 10% deduction per day, max 3 days" style={inp} /></div>
              <div style={{ marginBottom: 12 }}><Label text="Attendance Policy" /><input value={form.attendancePolicy} onChange={e => set("attendancePolicy", e.target.value)} placeholder="e.g. Attendance not required but quizzes in class" style={inp} /></div>
              <div><Label text="Extra Credit" /><input value={form.extraCreditPolicy} onChange={e => set("extraCreditPolicy", e.target.value)} placeholder="e.g. Optional final project for up to 5% extra credit" style={inp} /></div>
            </div>
          </div>
        )}

        {/* Step 5: Other & Tips */}
        {step === 5 && (
          <div>
            <div style={card}>
              <AssignmentList title="Homework Assignments" items={homeworks} onAdd={() => addAssignment(setHomeworks, "HW")} onRemove={i => removeAssignment(setHomeworks, i)} onUpdate={(i,f,v) => updateAssignment(setHomeworks,i,f,v)} addLabel="Homework" />
              <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "16px 0" }} />
              <AssignmentList title="Quizzes" items={quizzes} onAdd={() => addAssignment(setQuizzes, "Quiz")} onRemove={i => removeAssignment(setQuizzes, i)} onUpdate={(i,f,v) => updateAssignment(setQuizzes,i,f,v)} addLabel="Quiz" />
            </div>
            <div style={card}>
              <Label text="Survival Tip for Future Students" />
              <textarea value={form.tipText} onChange={e => set("tipText", e.target.value)} placeholder='e.g. "Start projects early. Midterm 1 is all about sorting algorithms."' rows={3}
                style={{ width: "100%", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", resize: "none" }} />
            </div>
          </div>
        )}

        {/* Step 6: Professor */}
        {step === 6 && (
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Rate {form.professorName || "your professor"}</h3>
            <p style={{ fontSize: 13, color: "#9A9A9A", marginBottom: 20 }}>Optional — but helps other students a lot.</p>
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {[1,2,3,4,5].map(i => (
                <button key={i} type="button" onClick={() => set("professorRating", i)} style={{ fontSize: 36, background: "none", border: "none", cursor: "pointer", color: i <= form.professorRating ? "#FFD200" : "#D1D5DB", padding: "0 2px" }}>★</button>
              ))}
              {form.professorRating > 0 && <span style={{ fontSize: 14, color: "#9A9A9A", alignSelf: "center", marginLeft: 8 }}>{["","Poor","Fair","Good","Great","Excellent"][form.professorRating]}</span>}
            </div>
            <Label text="Review (optional)" />
            <textarea value={form.professorComment} onChange={e => set("professorComment", e.target.value)} placeholder='e.g. "Very clear explanations. Always available during office hours."' rows={4}
              style={{ width: "100%", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", resize: "none" }} />
            <div style={{ background: "#F3F0E6", borderRadius: 10, padding: 14, marginTop: 16, fontSize: 13, color: "#5A5A5A", lineHeight: 1.6 }}>
              ✅ Ready to submit! Report for <strong>{form.courseCode}</strong> with <strong>{form.professorName}</strong> goes live after review.
            </div>
          </div>
        )}

        {error && <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#991B1B", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 12 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          {step > 1 ? <button onClick={() => setStep(s => s-1)} style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "white", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>← Back</button> : <div />}
          {step < 6 ? (
            <button onClick={() => setStep(s => s+1)} disabled={step===1 && (!form.courseCode || !form.professorName)}
              style={{ padding: "11px 28px", borderRadius: 10, border: "none", background: "#FFD200", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: step===1&&(!form.courseCode||!form.professorName)?0.5:1 }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              style={{ padding: "11px 28px", borderRadius: 10, border: "none", background: "#1A1A1A", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#FFD200", opacity: submitting?0.5:1 }}>
              {submitting ? "Submitting..." : "Submit Report 🐢"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <SubmitContent />
    </Suspense>
  );
}
