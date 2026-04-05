export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const { searchParams } = new URL(req.url);

    const now = new Date();
    const period =
      searchParams.get("period") ??
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [year, month] = period.split("-").map(Number) as [number, number];
    const dateFrom = startOfMonth(new Date(year, month - 1));
    const dateTo   = endOfMonth(new Date(year, month - 1));

    const [budgets, actuals] = await Promise.all([
      prisma.budget.findMany({
        where: { organizationId: orgId, period },
        include: { category: true, project: true },
        orderBy: { category: { name: "asc" } },
      }),
      prisma.transaction.findMany({
        where: {
          organizationId: orgId,
          isPlanned: false,
          isConfirmed: true,
          date: { gte: dateFrom, lte: dateTo },
        },
        select: { categoryId: true, projectId: true, amount: true, type: true },
      }),
    ]);

    // Aggregate fact by categoryId
    const factMap = new Map<string, number>();
    for (const tx of actuals) {
      const key = tx.categoryId ?? "__none__";
      factMap.set(key, (factMap.get(key) ?? 0) + Number(tx.amount));
    }

    const rows = budgets.map((b) => {
      const planned      = Number(b.plannedAmount);
      const actual       = factMap.get(b.categoryId ?? "__none__") ?? 0;
      const delta        = actual - planned;
      const deltaPercent = planned > 0 ? Math.round((delta / planned) * 100) : 0;
      const pct          = planned > 0 ? Math.round((actual / planned) * 100) : 0;
      return {
        id:           b.id,
        categoryId:   b.categoryId,
        projectId:    b.projectId,
        categoryName: b.category?.name ?? b.project?.name ?? "Без категории",
        categoryType: b.category?.type ?? null,
        planned,
        actual,
        delta,
        deltaPercent,
        pct,
      };
    });

    const totalPlanned = rows.reduce((s, r) => s + r.planned, 0);
    const totalActual  = rows.reduce((s, r) => s + r.actual,  0);

    return NextResponse.json({
      rows,
      summary: {
        totalPlanned,
        totalActual,
        totalDelta: totalActual - totalPlanned,
        execution: totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0,
      },
      period,
    });
  } catch (err) {
    console.error("GET /api/budgets:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

const createSchema = z.object({
  period:        z.string().regex(/^\d{4}-\d{2}$/),
  categoryId:    z.string().optional(),
  projectId:     z.string().optional(),
  plannedAmount: z.number().positive(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const data = parsed.data;

    // Upsert: try to find existing and update, or create
    const existing = await prisma.budget.findFirst({
      where: {
        organizationId: orgId,
        period:         data.period,
        categoryId:     data.categoryId ?? null,
      },
    });

    const budget = existing
      ? await prisma.budget.update({
          where: { id: existing.id },
          data: { plannedAmount: data.plannedAmount },
        })
      : await prisma.budget.create({
          data: {
            organizationId: orgId,
            period:         data.period,
            categoryId:     data.categoryId ?? null,
            projectId:      data.projectId  ?? null,
            plannedAmount:  data.plannedAmount,
          },
        });

    return NextResponse.json(budget, { status: 201 });
  } catch (err) {
    console.error("POST /api/budgets:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const budget = await prisma.budget.findFirst({ where: { id, organizationId: orgId } });
    if (!budget) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

    await prisma.budget.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/budgets:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
