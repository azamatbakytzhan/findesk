import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountsClient } from "./accounts-client";

export default async function AccountsPage() {
  const session = await auth();
  if (!session) return null;

  const accounts = await prisma.account.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      _count: { select: { transactions: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <AccountsClient
      accounts={accounts.map((a) => ({
        ...a,
        balance: Number(a.balance),
        transactionCount: a._count.transactions,
      }))}
    />
  );
}
