// src/lib/metrics.ts
// Computes averaged metrics from a list of approved reports

import { Report, ClassType } from "@prisma/client";
import { CourseMetrics } from "@/types";

export function computeMetrics(reports: Report[]): CourseMetrics | null {
  const approved = reports.filter((r) => r.status === "APPROVED");
  if (approved.length === 0) return null;

  const avg = (vals: number[]) =>
    vals.reduce((a, b) => a + b, 0) / vals.length;

  const midtermAverages = approved
    .map((r) => r.midtermAverage)
    .filter((v): v is number => v !== null);

  const midtermDifficulties = approved
    .map((r) => r.midtermDifficulty)
    .filter((v): v is number => v !== null);

  // Find most common class type
  const typeCounts: Record<ClassType, number> = {
    EXAM_HEAVY: 0,
    PROJECT_HEAVY: 0,
    BALANCED: 0,
  };
  for (const r of approved) typeCounts[r.classType]++;
  const dominantClassType = Object.entries(typeCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0] as ClassType;

  return {
    avgDifficulty: avg(approved.map((r) => r.overallDifficulty)),
    avgWorkload: avg(approved.map((r) => r.weeklyWorkloadHours)),
    avgMidtermDifficulty:
      midtermDifficulties.length > 0 ? avg(midtermDifficulties) : null,
    avgMidtermAverage:
      midtermAverages.length > 0 ? avg(midtermAverages) : null,
    avgAssignmentCount: avg(approved.map((r) => r.assignmentCount)),
    avgMidtermCount: avg(approved.map((r) => r.midtermCount)),
    reportCount: approved.length,
    dominantClassType,
  };
}

// Validation for incoming report submissions
export function validateReport(data: Record<string, unknown>): string | null {
  const { overallDifficulty, weeklyWorkloadHours, assignmentCount, midtermCount, midtermDifficulty } = data as Record<string, number>;

  if (overallDifficulty < 1 || overallDifficulty > 10)
    return "Difficulty must be between 1 and 10";
  if (weeklyWorkloadHours < 0 || weeklyWorkloadHours > 60)
    return "Workload hours must be between 0 and 60";
  if (assignmentCount < 0 || assignmentCount > 50)
    return "Assignment count seems unrealistic";
  if (midtermCount < 0 || midtermCount > 10)
    return "Midterm count seems unrealistic";
  if (
    midtermDifficulty !== undefined &&
    (midtermDifficulty < 1 || midtermDifficulty > 10)
  )
    return "Midterm difficulty must be between 1 and 10";

  return null;
}
