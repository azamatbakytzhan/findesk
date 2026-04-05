export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Daily cron: mark severely overdue planned transactions as flagged
// (currently just returns stats — extend as needed)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const overdue = await prisma.transaction.count({
      where: {
        isPlanned:   true,
        isConfirmed: false,
        date:        { lt: thirtyDaysAgo },
      },
    });

    return NextResponse.json({ overdue, checkedAt: new Date().toISOString() });
  } catch (err) {
    console.error("GET /api/cron/confirm-overdue:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
