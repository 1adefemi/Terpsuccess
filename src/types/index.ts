// src/types/index.ts

export type CourseWithMetrics = {
  id: string;
  courseCode: string;
  title: string;
  description?: string;
  credits?: number;
  department: {
    code: string;
    name: string;
  };
  metrics: CourseMetrics | null;
};

export type CourseMetrics = {
  avgDifficulty: number;
  avgWorkload: number;
  avgMidtermDifficulty: number | null;
  avgMidtermAverage: number | null;
  avgAssignmentCount: number;
  avgMidtermCount: number;
  reportCount: number;
  dominantClassType: "EXAM_HEAVY" | "PROJECT_HEAVY" | "BALANCED";
};

export type ProfessorWithMetrics = {
  id: string;
  fullName: string;
  courses: {
    courseCode: string;
    courseTitle: string;
    metrics: CourseMetrics | null;
  }[];
};

export type ReportFormData = {
  courseCode: string;
  professorName: string;
  semester: "FALL" | "SPRING" | "SUMMER" | "WINTER";
  year: number;
  overallDifficulty: number;
  weeklyWorkloadHours: number;
  assignmentCount: number;
  midtermCount: number;
  midtermAverage?: number;
  midtermDifficulty?: number;
  classType: "EXAM_HEAVY" | "PROJECT_HEAVY" | "BALANCED";
  tipText?: string;
};
