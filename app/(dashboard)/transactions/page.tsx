import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionsClient } from "./transactions-client";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session) return null;

  const orgId = session.user.organizationId;

  const [transactions, accounts, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { organizationId: orgId },
      orderBy: { date: "desc" },
      take: 50,
      include: {
        category: true,
        account: true,
        project: true,
        counterparty: true,
      },
    }),
    prisma.account.findMany({
      where: { organizationId: orgId, isArchived: false },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <TransactionsClient
      initialTransactions={transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      }))}
      accounts={accounts.map((a) => ({ ...a, balance: Number(a.balance) }))}
      categories={categories}
    />
  );
}
