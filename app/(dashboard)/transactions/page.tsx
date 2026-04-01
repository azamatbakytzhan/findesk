import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionsPageClient } from "./transactions-page-client";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session) return null;

  const orgId = session.user.organizationId;

  const [accounts, categories, projects] = await Promise.all([
    prisma.account.findMany({
      where: { organizationId: orgId, isArchived: false },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { organizationId: orgId, status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <TransactionsPageClient
      accounts={accounts.map((a) => ({ id: a.id, name: a.name, balance: Number(a.balance) }))}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        parentId: c.parentId,
      }))}
      projects={projects.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
