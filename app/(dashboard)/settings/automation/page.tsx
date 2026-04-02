import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AutomationClient } from "./automation-client";

export default async function AutomationPage() {
  const session = await auth();
  if (!session) return null;

  const [categories, projects] = await Promise.all([
    prisma.category.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true },
    }),
    prisma.project.findMany({
      where: { organizationId: session.user.organizationId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return <AutomationClient categories={categories} projects={projects} />;
}
