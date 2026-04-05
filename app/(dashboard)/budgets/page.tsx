export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BudgetsClient } from "./budgets-client";
import { PlanGate } from "@/components/plan-gate";

export default async function BudgetsPage() {
  const session = await auth();
  if (!session) return null;

  const categories = await prisma.category.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true },
  });

  return (
    <PlanGate feature="budgetModule">
      <BudgetsClient categories={categories} />
    </PlanGate>
  );
}
