import { Report, ClassType } from "@prisma/client";

export type CourseMetrics = {
  avgDifficulty: number;
  avgWorkload: number;
  avgMidtermDifficulty: number | null;
  avgMidtermAverage: number | null;
  avgAssignmentCount: number;
  avgMidtermCount: number;
  avgProjectCount: number;
  avgLabCount: number;
  avgHwCount: number;
  reportCount: number;
  dominantClassType: ClassType;
};

export function computeMetrics(reports: Report[]): CourseMetrics | null {
  const a = reports.filter(r => r.status === "APPROVED");
  if (a.length === 0) return null;
  const avg = (vals: number[]) => vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : 0;
  const midtermAvgs = a.map(r => r.midtermAverage).filter((v): v is number => v !== null);
  const midtermDiffs = a.map(r => r.midtermDifficulty).filter((v): v is number => v !== null);
  const typeCounts: Record<ClassType, number> = { EXAM_HEAVY: 0, PROJECT_HEAVY: 0, BALANCED: 0 };
  for (const r of a) typeCounts[r.classType]++;
  const dominantClassType = Object.entries(typeCounts).sort((x, y) => y[1] - x[1])[0][0] as ClassType;
  return {
    avgDifficulty: avg(a.map(r => r.overallDifficulty)),
    avgWorkload: avg(a.map(r => r.weeklyWorkloadHours)),
    avgMidtermDifficulty: midtermDiffs.length ? avg(midtermDiffs) : null,
    avgMidtermAverage: midtermAvgs.length ? avg(midtermAvgs) : null,
    avgAssignmentCount: avg(a.map(r => r.assignmentCount)),
    avgMidtermCount: avg(a.map(r => r.midtermCount)),
    avgProjectCount: avg(a.map(r => (r as Record<string, unknown>).projectCount as number ?? 0)),
    avgLabCount: avg(a.map(r => (r as Record<string, unknown>).labCount as number ?? 0)),
    avgHwCount: avg(a.map(r => (r as Record<string, unknown>).hwCount as number ?? 0)),
    reportCount: a.length,
    dominantClassType,
  };
}

export function validateReport(d: Record<string, unknown>): string | null {
  const { overallDifficulty, weeklyWorkloadHours, assignmentCount, midtermCount } = d as Record<string, number>;
  if (overallDifficulty < 1 || overallDifficulty > 10) return "Difficulty must be 1–10";
  if (weeklyWorkloadHours < 0 || weeklyWorkloadHours > 60) return "Workload must be 0–60 hrs";
  if (assignmentCount < 0 || assignmentCount > 100) return "Assignment count seems off";
  if (midtermCount < 0 || midtermCount > 10) return "Midterm count seems off";
  return null;
}
