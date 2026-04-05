export const dynamic = "force-dynamic";


import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

function eachDayOf(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= last) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(req.url);

    const now           = new Date();
    const defaultFrom   = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultTo     = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const dateFrom = new Date(searchParams.get("dateFrom") ?? defaultFrom.toISOString());
    const dateTo   = new Date(searchParams.get("dateTo")   ?? defaultTo.toISOString());

    // Current balance across all accounts
    const accounts = await prisma.account.findMany({
      where: { organizationId: orgId, isArchived: false },
      select: { balance: true },
    });
    const currentBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

    // Planned transactions in the window
    const planned = await prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        isPlanned: true,
        date: { gte: dateFrom, lte: dateTo },
      },
      include: {
        category: { select: { id: true, name: true } },
        account:  { select: { id: true, name: true } },
      },
      orderBy: { date: "asc" },
    });

    // Confirmed transactions already in the window
    const confirmed = await prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        isPlanned: false,
        isConfirmed: true,
        date: { gte: dateFrom, lte: dateTo },
      },
      orderBy: { date: "asc" },
    });

    // Build day-by-day forecast
    const days = eachDayOf(dateFrom, dateTo);
    let running = currentBalance;

    const forecast = days.map((day) => {
      const dayConfirmed = confirmed.filter((tx) => isSameDay(new Date(tx.date), day));
      const dayPlanned   = planned.filter((tx)   => isSameDay(new Date(tx.date), day));

      for (const tx of dayConfirmed) {
        running += tx.type === "INCOME" ? Number(tx.amount) : -Number(tx.amount);
      }
      for (const tx of dayPlanned) {
        running += tx.type === "INCOME" ? Number(tx.amount) : -Number(tx.amount);
      }

      return {
        date:         day.toISOString(),
        balance:      running,
        hasGap:       running < 0,
        transactions: dayPlanned.map((tx) => ({
          id:          tx.id,
          type:        tx.type,
          amount:      Number(tx.amount),
          description: tx.description,
          category:    tx.category,
          account:     tx.account,
        })),
        confirmedCount: dayConfirmed.length,
      };
    });

    const gapDays = forecast.filter((d) => d.hasGap);

    return NextResponse.json({
      forecast,
      currentBalance,
      totalPlanned: planned.length,
      gapDays: gapDays.length,
      summary: {
        plannedIncome:   planned.filter((t) => t.type === "INCOME")
                                .reduce((s, t) => s + Number(t.amount), 0),
        plannedExpense:  planned.filter((t) => t.type === "EXPENSE")
                                .reduce((s, t) => s + Number(t.amount), 0),
      },
    });
  } catch (error) {
    console.error("GET /api/calendar:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
