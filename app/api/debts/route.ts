export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type TxWithRelations = Awaited<ReturnType<typeof fetchTxs>>[number];

async function fetchTxs(orgId: string, type: "INCOME" | "EXPENSE") {
  return prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      type,
      isConfirmed: false,
      isPlanned: true,
    },
    include: {
      counterparty: { select: { id: true, name: true } },
      category:     { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  });
}

function groupByCounterparty(txs: TxWithRelations[], today: Date) {
  const map = new Map<
    string,
    { counterpartyId: string | null; name: string; total: number; overdue: number; items: TxWithRelations[] }
  >();

  for (const tx of txs) {
    const key = tx.counterpartyId ?? "__unknown__";
    if (!map.has(key)) {
      map.set(key, {
        counterpartyId: tx.counterpartyId,
        name:    tx.counterparty?.name ?? "Без контрагента",
        total:   0,
        overdue: 0,
        items:   [],
      });
    }
    const g = map.get(key)!;
    g.total += Number(tx.amount);
    if (tx.date < today) g.overdue += Number(tx.amount);
    g.items.push(tx);
  }

  return Array.from(map.values());
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;

    const today = new Date();
    const [receivables, payables] = await Promise.all([
      fetchTxs(orgId, "INCOME"),
      fetchTxs(orgId, "EXPENSE"),
    ]);

    return NextResponse.json({
      receivables: {
        total:   receivables.reduce((s, t) => s + Number(t.amount), 0),
        overdue: receivables.filter((t) => t.date < today).reduce((s, t) => s + Number(t.amount), 0),
        byCounterparty: groupByCounterparty(receivables, today).map((g) => ({
          ...g,
          items: g.items.map((t) => ({
            id:          t.id,
            date:        t.date,
            amount:      Number(t.amount),
            description: t.description,
            category:    t.category,
            isOverdue:   t.date < today,
          })),
        })),
      },
      payables: {
        total:   payables.reduce((s, t) => s + Number(t.amount), 0),
        overdue: payables.filter((t) => t.date < today).reduce((s, t) => s + Number(t.amount), 0),
        byCounterparty: groupByCounterparty(payables, today).map((g) => ({
          ...g,
          items: g.items.map((t) => ({
            id:          t.id,
            date:        t.date,
            amount:      Number(t.amount),
            description: t.description,
            category:    t.category,
            isOverdue:   t.date < today,
          })),
        })),
      },
    });
  } catch (err) {
    console.error("GET /api/debts:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
