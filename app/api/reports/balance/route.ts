import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.user.organizationId;

    const accounts = await prisma.account.findMany({
      where: { organizationId: orgId, isArchived: false },
    });

    const cashAssets = accounts.reduce((s, a) => s + Number(a.balance), 0);

    return NextResponse.json({
      assets: {
        cash: cashAssets,
        receivables: 0,
        total: cashAssets,
      },
      liabilities: {
        payables: 0,
        total: 0,
      },
      equity: cashAssets,
      totalPassives: cashAssets,
    });
  } catch (error) {
    console.error("GET /api/reports/balance error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
