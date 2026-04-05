export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  categoryId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  counterpartyId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  isPlanned: z.boolean().optional(),
  isConfirmed: z.boolean().optional(),
  date: z.string().optional(),
  amount: z.number().positive().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

    const orgId = session.user.organizationId;

    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, organizationId: orgId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Транзакция не найдена" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Ошибка валидации" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Handle confirming a planned transaction (update account balance)
    if (data.isConfirmed === true && existing.isPlanned) {
      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.transaction.update({
          where: { id: params.id },
          data: {
            ...data,
            ...(data.date && { date: new Date(data.date) }),
            isPlanned: false,
            isConfirmed: true,
          },
          include: { category: true, account: true, project: true, counterparty: true },
        });

        // Apply balance change since it was planned before
        const delta =
          existing.type === "INCOME"
            ? Number(existing.amount)
            : -Number(existing.amount);
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { increment: delta } },
        });

        return result;
      });
      return NextResponse.json(updated);
    }

    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(data.date && { date: new Date(data.date) }),
      },
      include: { category: true, account: true, project: true, counterparty: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/transactions/[id] error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

    const orgId = session.user.organizationId;

    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, organizationId: orgId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Транзакция не найдена" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.delete({ where: { id: params.id } });

      // Reverse the balance impact for confirmed non-planned transactions
      if (!existing.isPlanned && existing.isConfirmed) {
        const delta =
          existing.type === "INCOME"
            ? -Number(existing.amount)
            : Number(existing.amount);
        if (delta !== 0) {
          await tx.account.update({
            where: { id: existing.accountId },
            data: { balance: { increment: delta } },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
