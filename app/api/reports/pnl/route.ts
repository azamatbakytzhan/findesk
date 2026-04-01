import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate и endDate обязательны" }, { status: 400 });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        date: { gte: new Date(startDate), lte: new Date(endDate) },
        isConfirmed: true,
      },
      include: { category: true },
    });

    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((s, t) => s + Number(t.amount), 0);

    return NextResponse.json({
      income,
      expense,
      grossProfit: income,
      operatingExpenses: expense,
      ebitda: income - expense,
      netProfit: income - expense,
      transactionCount: transactions.length,
    });
  } catch (error) {
    console.error("GET /api/reports/pnl error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
