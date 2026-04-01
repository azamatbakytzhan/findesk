import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthShort } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(req.url);
    const months = parseInt(searchParams.get("months") ?? "6");

    const now = new Date();
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const txs = await prisma.transaction.findMany({
        where: {
          organizationId: orgId,
          date: { gte: start, lte: end },
          isConfirmed: true,
        },
      });

      const income = txs
        .filter((t) => t.type === "INCOME")
        .reduce((s, t) => s + Number(t.amount), 0);
      const expense = txs
        .filter((t) => t.type === "EXPENSE")
        .reduce((s, t) => s + Number(t.amount), 0);

      result.push({
        month: getMonthShort(start.getMonth()),
        year: start.getFullYear(),
        income,
        expense,
        netFlow: income - expense,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/reports/cashflow error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
