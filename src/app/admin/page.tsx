// src/app/admin/page.tsx
// Simple admin panel to approve/reject pending reports
// TODO: Add proper auth protection before deploying

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const pending = await prisma.report.findMany({
    where: { status: "PENDING" },
    include: {
      offering: {
        include: {
          course: true,
          professor: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const stats = await prisma.report.groupBy({
    by: ["status"],
    _count: true,
  });

  return <AdminClient pending={pending} stats={stats} />;
}
