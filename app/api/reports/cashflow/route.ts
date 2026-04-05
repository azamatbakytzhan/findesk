export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function eachMonthOf(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= last) {
    months.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

const MONTH_NAMES = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(req.url);

    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), 0, 1);       // Jan 1
    const defaultTo   = new Date(now.getFullYear(), 11, 31);     // Dec 31

    const dateFrom  = new Date(searchParams.get("dateFrom") ?? defaultFrom.toISOString());
    const dateTo    = new Date(searchParams.get("dateTo")   ?? defaultTo.toISOString());
    const accountId = searchParams.get("accountId");

    const transactions = await prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        isPlanned: false,
        isConfirmed: true,
        date: { gte: dateFrom, lte: dateTo },
        ...(accountId ? { accountId } : {}),
      },
      include: { category: true },
      orderBy: { date: "asc" },
    });

    const months   = eachMonthOf(dateFrom, dateTo);
    const labels   = months.map((m) => `${MONTH_NAMES[m.getMonth()]} ${m.getFullYear()}`);
    const n        = months.length;

    // per-category totals: categoryId → values[monthIdx]
    const catTotals = new Map<string, { name: string; type: string; values: number[] }>();

    for (const tx of transactions) {
      const mIdx = months.findIndex((m) => isSameMonth(m, tx.date));
      if (mIdx === -1) continue;

      const key  = tx.categoryId ?? "__none__";
      const name = tx.category?.name ?? "Без категории";
      const type = tx.type;

      if (!catTotals.has(key)) {
        catTotals.set(key, { name, type, values: new Array(n).fill(0) });
      }
      const entry = catTotals.get(key)!;
      entry.values[mIdx] += Number(tx.amount);
    }

    // Build rows
    interface CfRow {
      id: string; name: string; isGroup: boolean;
      type: "INCOME" | "EXPENSE"; indent: number;
      values: number[]; total: number;
    }

    const incomeRows: CfRow[] = [];
    const expenseRows: CfRow[] = [];

    for (const [id, entry] of Array.from(catTotals.entries())) {
      const total = entry.values.reduce((s, v) => s + v, 0);
      const row: CfRow = {
        id, name: entry.name, isGroup: false,
        type: entry.type === "INCOME" ? "INCOME" : "EXPENSE",
        indent: 1, values: entry.values, total,
      };
      if (entry.type === "INCOME") incomeRows.push(row);
      else                          expenseRows.push(row);
    }

    // Group sums
    const incomeSums  = new Array(n).fill(0);
    const expenseSums = new Array(n).fill(0);
    for (const r of incomeRows)  r.values.forEach((v, i) => { incomeSums[i]  += v; });
    for (const r of expenseRows) r.values.forEach((v, i) => { expenseSums[i] += v; });

    const netFlow = incomeSums.map((v, i) => v - expenseSums[i]);

    const rows: CfRow[] = [
      {
        id: "__income_group__", name: "ПОСТУПЛЕНИЯ", isGroup: true,
        type: "INCOME", indent: 0,
        values: incomeSums, total: incomeSums.reduce((s, v) => s + v, 0),
      },
      ...incomeRows.sort((a, b) => b.total - a.total),
      {
        id: "__expense_group__", name: "ПЛАТЕЖИ", isGroup: true,
        type: "EXPENSE", indent: 0,
        values: expenseSums, total: expenseSums.reduce((s, v) => s + v, 0),
      },
      ...expenseRows.sort((a, b) => b.total - a.total),
    ];

    return NextResponse.json({
      months: labels,
      rows,
      summary: { income: incomeSums, expense: expenseSums, netFlow },
    });
  } catch (error) {
    console.error("GET /api/reports/cashflow:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
