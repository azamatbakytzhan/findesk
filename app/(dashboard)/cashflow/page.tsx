export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CashflowClient } from "./cashflow-client";

export default async function CashflowPage() {
  const session = await auth();
  if (!session) return null;

  const accounts = await prisma.account.findMany({
    where: { organizationId: session.user.organizationId, isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <CashflowClient accounts={accounts} />;
}
