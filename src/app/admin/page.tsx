export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const pendingReports = await prisma.report.findMany({
    where: { status: "PENDING" },
    include: { offering: { include: { course: true, professor: true } } },
    orderBy: { createdAt: "asc" },
  });

  const pendingReviews = await prisma.professorReview.findMany({
    where: { status: "PENDING" },
    include: { professor: true },
    orderBy: { createdAt: "asc" },
  });

  const stats = {
    pendingReports: pendingReports.length,
    pendingReviews: pendingReviews.length,
    totalReports: await prisma.report.count({ where: { status: "APPROVED" } }),
    totalReviews: await prisma.professorReview.count({ where: { status: "APPROVED" } }),
  };

  return <AdminClient pendingReports={pendingReports} pendingReviews={pendingReviews} stats={stats} />;
}
