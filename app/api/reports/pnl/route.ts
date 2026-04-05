export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(req.url);

    const now        = new Date();
    const defaultFrom = new Date(now.getFullYear(), 0, 1);
    const defaultTo   = new Date(now.getFullYear(), 11, 31);

    const dateFrom = new Date(searchParams.get("dateFrom") ?? defaultFrom.toISOString());
    const dateTo   = new Date(searchParams.get("dateTo")   ?? defaultTo.toISOString());

    const transactions = await prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        isPlanned: false,
        isConfirmed: true,
        date: { gte: dateFrom, lte: dateTo },
      },
      include: { category: true },
      orderBy: { date: "asc" },
    });

    const months = eachMonthOf(dateFrom, dateTo);
    const labels = months.map((m) => `${MONTH_NAMES[m.getMonth()]} ${m.getFullYear()}`);
    const n      = months.length;

    const zeros = () => new Array<number>(n).fill(0);

    const revenue  = zeros();
    const expenses = zeros();

    for (const tx of transactions) {
      const mIdx = months.findIndex((m) => isSameMonth(m, tx.date));
      if (mIdx === -1) continue;
      if (tx.type === "INCOME")  revenue[mIdx]  += Number(tx.amount);
      if (tx.type === "EXPENSE") expenses[mIdx] += Number(tx.amount);
    }

    // Calculated lines
    const grossProfit = revenue.map((v, i) => v - 0);            // no COGS yet
    const ebitda      = grossProfit.map((v, i) => v - expenses[i]);
    const netProfit   = ebitda;                                    // no depreciation / interest yet

    // Margin (%)
    const margin = revenue.map((v, i) =>
      v > 0 ? Math.round((netProfit[i]! / v) * 100) : 0
    );

    const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0);

    const rows = [
      { key: "revenue",     label: "Выручка",                    values: revenue,     isCalculated: false, sign: 1 },
      { key: "cogs",        label: "Себестоимость",              values: zeros(),     isCalculated: false, sign: -1 },
      { key: "grossProfit", label: "Валовая прибыль",            values: grossProfit, isCalculated: true,  sign: 1 },
      { key: "opex",        label: "Операционные расходы",       values: expenses,    isCalculated: false, sign: -1 },
      { key: "ebitda",      label: "EBITDA",                     values: ebitda,      isCalculated: true,  sign: 1 },
      { key: "depr",        label: "Амортизация",                values: zeros(),     isCalculated: false, sign: -1 },
      { key: "netProfit",   label: "Чистая прибыль",             values: netProfit,   isCalculated: true,  sign: 1 },
      { key: "margin",      label: "Рентабельность, %",          values: margin,      isCalculated: true,  sign: 1, isPercent: true },
    ];

    return NextResponse.json({
      months: labels,
      rows: rows.map((r) => ({ ...r, total: sum(r.values) })),
      totals: {
        revenue:    sum(revenue),
        expenses:   sum(expenses),
        grossProfit: sum(grossProfit),
        ebitda:     sum(ebitda),
        netProfit:  sum(netProfit),
        margin:     sum(revenue) > 0
          ? Math.round((sum(netProfit) / sum(revenue)) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error("GET /api/reports/pnl:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
