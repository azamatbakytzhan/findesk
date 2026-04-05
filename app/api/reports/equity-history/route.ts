export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Returns equity (Собственный капитал) for the last 12 months.
// Equity(month) = CashAtMonthEnd + ReceivablesAtMonth − PayablesAtMonth
//
// CashAtMonthEnd   = currentBalance − Σ(confirmed INCOME after monthEnd)
//                                   + Σ(confirmed EXPENSE after monthEnd)
// ReceivablesAt(M) = Σ(unconfirmed INCOME  with date ≤ monthEnd)
// PayablesAt(M)    = Σ(unconfirmed EXPENSE with date ≤ monthEnd)

function endOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
    const orgId = session.user.organizationId;

    const now = new Date();

    const [accounts, confirmedTxs, unconfirmedTxs] = await Promise.all([
      prisma.account.findMany({
        where: { organizationId: orgId, isArchived: false },
        select: { balance: true },
      }),
      // All confirmed transactions — we'll filter per month in JS
      prisma.transaction.findMany({
        where: {
          organizationId: orgId,
          isConfirmed: true,
          isPlanned:   false,
          type:        { in: ["INCOME", "EXPENSE"] },
        },
        select: { date: true, type: true, amount: true },
      }),
      // All unconfirmed (planned) transactions
      prisma.transaction.findMany({
        where: {
          organizationId: orgId,
          isConfirmed: false,
          type:        { in: ["INCOME", "EXPENSE"] },
        },
        select: { date: true, type: true, amount: true },
      }),
    ]);

    const currentBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

    // Build 12 monthly data points (oldest → newest)
    const points = Array.from({ length: 12 }, (_, i) => {
      const offset = 11 - i; // 11 months ago → now
      const d      = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const monthEnd = endOfMonth(d.getFullYear(), d.getMonth());

      // Cash at monthEnd: subtract transactions that happened AFTER monthEnd
      let cash = currentBalance;
      for (const tx of confirmedTxs) {
        const txDate = new Date(tx.date);
        if (txDate > monthEnd) {
          // Reverse the effect: income that came in after → subtract, expense after → add back
          cash += tx.type === "INCOME" ? -Number(tx.amount) : Number(tx.amount);
        }
      }

      // Receivables at monthEnd: unconfirmed income with date ≤ monthEnd
      const receivables = unconfirmedTxs
        .filter((tx) => tx.type === "INCOME" && new Date(tx.date) <= monthEnd)
        .reduce((s, tx) => s + Number(tx.amount), 0);

      // Payables at monthEnd: unconfirmed expense with date ≤ monthEnd
      const payables = unconfirmedTxs
        .filter((tx) => tx.type === "EXPENSE" && new Date(tx.date) <= monthEnd)
        .reduce((s, tx) => s + Number(tx.amount), 0);

      const equity = cash + receivables - payables;

      return {
        month:  d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" }),
        equity: Math.round(equity),
        cash:   Math.round(cash),
      };
    });

    return NextResponse.json({ points });
  } catch (err) {
    console.error("GET /api/reports/equity-history:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
