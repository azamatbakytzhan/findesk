import { z } from "zod";
import { prisma } from "@/lib/prisma";

export function buildAiTools(organizationId: string) {
  return {
    getTransactions: {
      description:
        "Get transactions for the organization with optional filters",
      parameters: z.object({
        limit: z.number().optional().default(20),
        type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        categoryId: z.string().optional(),
      }),
      execute: async ({
        limit,
        type,
        startDate,
        endDate,
        categoryId,
      }: {
        limit: number;
        type?: "INCOME" | "EXPENSE" | "TRANSFER";
        startDate?: string;
        endDate?: string;
        categoryId?: string;
      }) => {
        const transactions = await prisma.transaction.findMany({
          where: {
            organizationId,
            ...(type && { type }),
            ...(categoryId && { categoryId }),
            ...(startDate || endDate
              ? {
                  date: {
                    ...(startDate && { gte: new Date(startDate) }),
                    ...(endDate && { lte: new Date(endDate) }),
                  },
                }
              : {}),
          },
          include: { category: true, project: true, account: true },
          orderBy: { date: "desc" },
          take: limit,
        });
        return transactions;
      },
    },

    getReport: {
      description:
        "Get financial summary report: total income, expenses, and profit for a period",
      parameters: z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
      execute: async ({
        startDate,
        endDate,
      }: {
        startDate: string;
        endDate: string;
      }) => {
        const transactions = await prisma.transaction.findMany({
          where: {
            organizationId,
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
            isConfirmed: true,
          },
          include: { category: true },
        });

        const income = transactions
          .filter((t) => t.type === "INCOME")
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const expenses = transactions
          .filter((t) => t.type === "EXPENSE")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const byCategory = transactions.reduce(
          (acc, t) => {
            const key = t.category?.name ?? "Без категории";
            if (!acc[key]) acc[key] = { income: 0, expense: 0 };
            if (t.type === "INCOME") acc[key]!.income += Number(t.amount);
            if (t.type === "EXPENSE") acc[key]!.expense += Number(t.amount);
            return acc;
          },
          {} as Record<string, { income: number; expense: number }>
        );

        return {
          period: { startDate, endDate },
          income,
          expenses,
          profit: income - expenses,
          transactionCount: transactions.length,
          byCategory,
        };
      },
    },

    getAccounts: {
      description: "Get all bank accounts and their current balances",
      parameters: z.object({}),
      execute: async () => {
        const accounts = await prisma.account.findMany({
          where: { organizationId, isArchived: false },
          orderBy: { name: "asc" },
        });
        const total = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
        return { accounts, totalBalance: total };
      },
    },

    suggestCategory: {
      description: "Suggest a category for a transaction based on description",
      parameters: z.object({
        description: z.string(),
        amount: z.number(),
        type: z.enum(["INCOME", "EXPENSE"]),
      }),
      execute: async ({
        type,
      }: {
        description: string;
        amount: number;
        type: "INCOME" | "EXPENSE";
      }) => {
        const categories = await prisma.category.findMany({
          where: {
            organizationId,
            type: type === "INCOME" ? "INCOME" : "EXPENSE",
          },
        });
        return categories;
      },
    },
  };
}
