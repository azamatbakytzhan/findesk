import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.number().positive("Сумма должна быть положительной"),
  date: z.string(),
  accountId: z.string().min(1, "Выберите счёт"),
  categoryId: z.string().optional(),
  projectId: z.string().optional(),
  counterpartyId: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPlanned: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = session.user.organizationId;
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const type = searchParams.get("type") as "INCOME" | "EXPENSE" | "TRANSFER" | null;
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");

    const transactions = await prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        ...(type && { type }),
        ...(accountId && { accountId }),
        ...(categoryId && { categoryId }),
      },
      include: { category: true, account: true, project: true, counterparty: true },
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = transactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Ошибка валидации" },
        { status: 400 }
      );
    }

    const orgId = session.user.organizationId;
    const data = parsed.data;

    // Verify account belongs to this org
    const account = await prisma.account.findFirst({
      where: { id: data.accountId, organizationId: orgId },
    });
    if (!account) {
      return NextResponse.json({ error: "Счёт не найден" }, { status: 404 });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const newTx = await tx.transaction.create({
        data: {
          organizationId: orgId,
          accountId: data.accountId,
          type: data.type,
          amount: data.amount,
          date: new Date(data.date),
          categoryId: data.categoryId || null,
          projectId: data.projectId || null,
          counterpartyId: data.counterpartyId || null,
          description: data.description || null,
          tags: data.tags ?? [],
          isPlanned: data.isPlanned ?? false,
        },
        include: { category: true, account: true },
      });

      // Update account balance
      if (!data.isPlanned) {
        const balanceDelta =
          data.type === "INCOME"
            ? data.amount
            : data.type === "EXPENSE"
            ? -data.amount
            : 0;

        if (balanceDelta !== 0) {
          await tx.account.update({
            where: { id: data.accountId },
            data: { balance: { increment: balanceDelta } },
          });
        }
      }

      return newTx;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
