import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const createSchema = z.object({
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

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const type = searchParams.get("type") as "INCOME" | "EXPENSE" | "TRANSFER" | null;
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const projectId = searchParams.get("projectId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");
    const isPlanned = searchParams.get("isPlanned");

    const where: Prisma.TransactionWhereInput = {
      organizationId: orgId,
      ...(type && { type }),
      ...(accountId && { accountId }),
      ...(categoryId && { categoryId }),
      ...(projectId && { projectId }),
      ...(isPlanned !== null && { isPlanned: isPlanned === "true" }),
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo + "T23:59:59") }),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: "insensitive" } },
              { counterparty: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        include: {
          account: { select: { id: true, name: true, currency: true } },
          category: { select: { id: true, name: true, color: true } },
          project: { select: { id: true, name: true } },
          counterparty: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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
    const parsed = createSchema.safeParse(body);

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
          categoryId: data.categoryId ?? null,
          projectId: data.projectId ?? null,
          counterpartyId: data.counterpartyId ?? null,
          description: data.description ?? null,
          tags: data.tags ?? [],
          isPlanned: data.isPlanned ?? false,
          currency: account.currency,
        },
        include: {
          category: true,
          account: true,
          project: true,
          counterparty: true,
        },
      });

      // Update account balance for confirmed transactions
      if (!data.isPlanned) {
        const delta =
          data.type === "INCOME"
            ? data.amount
            : data.type === "EXPENSE"
            ? -data.amount
            : 0;
        if (delta !== 0) {
          await tx.account.update({
            where: { id: data.accountId },
            data: { balance: { increment: delta } },
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
