export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plan-limits";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

    const orgId = session.user.organizationId;

    const [org, history] = await Promise.all([
      prisma.organization.findUnique({
        where:  { id: orgId },
        select: { plan: true, trialEndsAt: true },
      }),
      prisma.paymentHistory.findMany({
        where:   { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take:    20,
      }),
    ]);

    if (!org) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

    const PLAN_PRICES: Record<PlanKey, number> = { START: 0, BUSINESS: 29900, FIRST: 99900 };

    return NextResponse.json({
      current:     org.plan,
      trialEndsAt: org.trialEndsAt,
      limits:      PLAN_LIMITS[org.plan as PlanKey] ?? PLAN_LIMITS.START,
      prices:      PLAN_PRICES,
      history,
    });
  } catch (error) {
    console.error("GET /api/billing:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orgId = session.user.organizationId;
    const { plan } = (await req.json()) as { plan: PlanKey };

    if (!["START", "BUSINESS", "FIRST"].includes(plan)) {
      return NextResponse.json({ error: "Неверный тариф" }, { status: 400 });
    }

    const PLAN_PRICES: Record<PlanKey, number> = { START: 0, BUSINESS: 29900, FIRST: 99900 };

    const [org] = await prisma.$transaction([
      prisma.organization.update({
        where: { id: orgId },
        data:  { plan },
      }),
      prisma.paymentHistory.create({
        data: {
          organizationId: orgId,
          plan,
          amount:      PLAN_PRICES[plan],
          currency:    "KZT",
          description: `Переход на тариф ${plan}`,
        },
      }),
    ]);

    return NextResponse.json({ plan: org.plan });
  } catch (error) {
    console.error("POST /api/billing:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
