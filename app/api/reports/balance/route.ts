export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const asOf = dateParam ? new Date(dateParam) : new Date();
    // Set to end of the day
    asOf.setHours(23, 59, 59, 999);

    const [accounts, receivableTxs, payableTxs] = await Promise.all([
      prisma.account.findMany({
        where: { organizationId: orgId, isArchived: false },
        select: { id: true, name: true, type: true, balance: true, currency: true },
      }),
      // Дебиторка: ожидаемые поступления (unconfirmed income)
      prisma.transaction.findMany({
        where: {
          organizationId: orgId,
          type:        "INCOME",
          isConfirmed: false,
          date:        { lte: asOf },
        },
        include: { counterparty: { select: { id: true, name: true } } },
        orderBy: { amount: "desc" },
      }),
      // Кредиторка: ожидаемые платежи (unconfirmed expense)
      prisma.transaction.findMany({
        where: {
          organizationId: orgId,
          type:        "EXPENSE",
          isConfirmed: false,
          date:        { lte: asOf },
        },
        include: { counterparty: { select: { id: true, name: true } } },
        orderBy: { amount: "desc" },
      }),
    ]);

    const cashTotal        = accounts.reduce((s, a) => s + Number(a.balance), 0);
    const receivablesTotal = receivableTxs.reduce((s, t) => s + Number(t.amount), 0);
    const payablesTotal    = payableTxs.reduce((s, t) => s + Number(t.amount), 0);

    const totalAssets      = cashTotal + receivablesTotal;
    const totalLiabilities = payablesTotal;
    const equity           = totalAssets - totalLiabilities;

    return NextResponse.json({
      asOf: asOf.toISOString(),
      assets: {
        cash:        { total: cashTotal,        items: accounts },
        receivables: { total: receivablesTotal, items: receivableTxs.map((t) => ({
          id:            t.id,
          amount:        Number(t.amount),
          description:   t.description,
          date:          t.date,
          counterparty:  t.counterparty,
        }))},
        total: totalAssets,
      },
      liabilities: {
        payables: { total: payablesTotal, items: payableTxs.map((t) => ({
          id:            t.id,
          amount:        Number(t.amount),
          description:   t.description,
          date:          t.date,
          counterparty:  t.counterparty,
        }))},
        total: totalLiabilities,
      },
      equity,
      balanced: Math.abs(totalAssets - (totalLiabilities + equity)) < 0.01,
    });
  } catch (err) {
    console.error("GET /api/reports/balance error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
