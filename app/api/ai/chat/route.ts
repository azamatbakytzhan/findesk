export const dynamic = 'force-dynamic'

import { streamText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session)
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const orgId   = session.user.organizationId;
    const orgName = session.user.orgName;
    const { messages } = await req.json();

    // Quick context for system prompt
    const accounts = await prisma.account.findMany({
      where: { organizationId: orgId, isArchived: false },
      select: { name: true, balance: true, currency: true },
    });
    const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

    const now        = new Date();
    const dateStr    = now.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    const accountsStr = accounts
      .map((a) => `${a.name}: ${Number(a.balance).toLocaleString("ru-RU")} ${a.currency}`)
      .join(", ");

    const result = await streamText({
      model:    anthropic("claude-sonnet-4-5"),
      maxSteps: 5,
      system: `Ты — финансовый ИИ-ассистент компании "${orgName}".
Текущая дата: ${dateStr}.
Суммарный баланс счетов: ${totalBalance.toLocaleString("ru-RU")} KZT.
Счета: ${accountsStr}.

Правила:
- Отвечай кратко и по делу, используй конкретные цифры
- Форматируй суммы: 1 234 567 ₸
- Если нужны данные — используй инструменты, не угадывай
- При анализе давай конкретные рекомендации
- Если данных недостаточно — скажи что именно нужно добавить в систему
- Всегда отвечай на русском языке`,
      messages,

      tools: {
        getTransactions: tool({
          description:
            "Получить транзакции за период с фильтрацией. Для вопросов о конкретных тратах, доходах, контрагентах.",
          parameters: z.object({
            dateFrom: z.string().describe("Дата начала YYYY-MM-DD"),
            dateTo:   z.string().describe("Дата конца YYYY-MM-DD"),
            type:     z.enum(["INCOME", "EXPENSE", "TRANSFER", "ALL"]).default("ALL"),
            limit:    z.number().default(20).describe("Максимум строк, не больше 50"),
          }),
          execute: async ({ dateFrom, dateTo, type, limit }) => {
            const where = {
              organizationId: orgId,
              isConfirmed:    true,
              isPlanned:      false,
              date:           { gte: new Date(dateFrom), lte: new Date(dateTo) },
              ...(type !== "ALL" && { type }),
            };
            const [txs, agg] = await Promise.all([
              prisma.transaction.findMany({
                where,
                include: {
                  category:    { select: { name: true } },
                  counterparty: { select: { name: true } },
                },
                orderBy: { date: "desc" },
                take: Math.min(limit, 50),
              }),
              prisma.transaction.aggregate({ where, _sum: { amount: true }, _count: true }),
            ]);
            return {
              transactions: txs.map((t) => ({
                date:         t.date.toLocaleDateString("ru-RU"),
                type:         t.type,
                amount:       Number(t.amount),
                category:     t.category?.name,
                counterparty: t.counterparty?.name,
                description:  t.description,
              })),
              totalAmount: Number(agg._sum.amount ?? 0),
              count:       agg._count,
            };
          },
        }),

        getCashflowReport: tool({
          description:
            "Отчёт о движении денег за период: доходы/расходы по категориям, итоги. Для вопросов о прибыли, топ расходах, итогах за период.",
          parameters: z.object({
            dateFrom: z.string().describe("Начало периода YYYY-MM-DD"),
            dateTo:   z.string().describe("Конец периода YYYY-MM-DD"),
          }),
          execute: async ({ dateFrom, dateTo }) => {
            const txs = await prisma.transaction.findMany({
              where: {
                organizationId: orgId,
                isConfirmed:    true,
                isPlanned:      false,
                date:           { gte: new Date(dateFrom), lte: new Date(dateTo) },
                type:           { in: ["INCOME", "EXPENSE"] },
              },
              include: { category: { select: { name: true } } },
            });

            const incomeByCategory: Record<string, number>  = {};
            const expenseByCategory: Record<string, number> = {};
            let totalIncome = 0;
            let totalExpense = 0;

            for (const tx of txs) {
              const cat = tx.category?.name ?? "Без категории";
              if (tx.type === "INCOME") {
                totalIncome += Number(tx.amount);
                incomeByCategory[cat] = (incomeByCategory[cat] ?? 0) + Number(tx.amount);
              } else {
                totalExpense += Number(tx.amount);
                expenseByCategory[cat] = (expenseByCategory[cat] ?? 0) + Number(tx.amount);
              }
            }

            return {
              period:   `${dateFrom} — ${dateTo}`,
              totalIncome,
              totalExpense,
              netFlow:  totalIncome - totalExpense,
              topIncomeCategories: Object.entries(incomeByCategory)
                .sort(([, a], [, b]) => b - a).slice(0, 5)
                .map(([name, amount]) => ({ name, amount })),
              topExpenseCategories: Object.entries(expenseByCategory)
                .sort(([, a], [, b]) => b - a).slice(0, 5)
                .map(([name, amount]) => ({ name, amount })),
            };
          },
        }),

        comparePeriods: tool({
          description:
            "Сравнить два периода. Для вопросов 'как изменились расходы', 'вырос ли доход'.",
          parameters: z.object({
            period1From: z.string(),
            period1To:   z.string(),
            period2From: z.string(),
            period2To:   z.string(),
          }),
          execute: async ({ period1From, period1To, period2From, period2To }) => {
            const agg = async (from: string, to: string) => {
              const rows = await prisma.transaction.groupBy({
                by: ["type"],
                where: {
                  organizationId: orgId,
                  isConfirmed:    true,
                  isPlanned:      false,
                  date:           { gte: new Date(from), lte: new Date(to) },
                  type:           { in: ["INCOME", "EXPENSE"] },
                },
                _sum: { amount: true },
              });
              const income  = Number(rows.find((r) => r.type === "INCOME" )?._sum.amount ?? 0);
              const expense = Number(rows.find((r) => r.type === "EXPENSE")?._sum.amount ?? 0);
              return { income, expense, netFlow: income - expense };
            };

            const [p1, p2] = await Promise.all([
              agg(period1From, period1To),
              agg(period2From, period2To),
            ]);

            const pct = (a: number, b: number) =>
              b > 0 ? Math.round(((a - b) / b) * 100) : 0;

            return {
              period1: { from: period1From, to: period1To, ...p1 },
              period2: { from: period2From, to: period2To, ...p2 },
              changes: {
                incomePercent:  pct(p1.income,  p2.income),
                expensePercent: pct(p1.expense, p2.expense),
                netFlowPercent: pct(p1.netFlow, p2.netFlow),
              },
            };
          },
        }),

        getCashGapForecast: tool({
          description: "Прогноз кассовых разрывов на ближайшие N дней.",
          parameters: z.object({
            days: z.number().default(30).describe("Количество дней"),
          }),
          execute: async ({ days }) => {
            const dateFrom = new Date();
            const dateTo   = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

            const [accs, planned] = await Promise.all([
              prisma.account.findMany({
                where: { organizationId: orgId, isArchived: false },
                select: { balance: true },
              }),
              prisma.transaction.findMany({
                where: { organizationId: orgId, isPlanned: true, date: { gte: dateFrom, lte: dateTo } },
                orderBy: { date: "asc" },
              }),
            ]);

            let balance = accs.reduce((s, a) => s + Number(a.balance), 0);
            const gaps: Array<{ date: string; balance: number }> = [];

            for (const tx of planned) {
              balance += tx.type === "INCOME" ? Number(tx.amount) : -Number(tx.amount);
              if (balance < 0)
                gaps.push({ date: tx.date.toLocaleDateString("ru-RU"), balance: Math.round(balance) });
            }

            return {
              currentBalance: accs.reduce((s, a) => s + Number(a.balance), 0),
              forecastDays:   days,
              gapsFound:      gaps.length,
              gaps:           gaps.slice(0, 5),
              safe:           gaps.length === 0,
            };
          },
        }),

        suggestCategory: tool({
          description: "Предложить категорию для транзакции по описанию.",
          parameters: z.object({
            description: z.string(),
            amount:      z.number(),
            type:        z.enum(["INCOME", "EXPENSE"]),
          }),
          execute: async ({ description, type }) => {
            const similar = await prisma.transaction.findMany({
              where: {
                organizationId: orgId,
                type,
                description:  { contains: description.split(" ")[0] ?? "", mode: "insensitive" },
                categoryId:   { not: null },
              },
              include: { category: true },
              take: 5,
              orderBy: { date: "desc" },
            });

            if (similar.length > 0) {
              const counts = similar.reduce<Record<string, number>>((acc, tx) => {
                acc[tx.categoryId!] = (acc[tx.categoryId!] ?? 0) + 1;
                return acc;
              }, {});
              const topId  = Object.entries(counts).sort(([, a], [, b]) => b - a)[0]![0];
              const topCat = similar.find((t) => t.categoryId === topId)?.category;
              return { suggested: topCat?.name, confidence: "high", basedOn: similar.length };
            }

            return { suggested: null, confidence: "low", basedOn: 0 };
          },
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("POST /api/ai/chat error:", error);
    return new Response(JSON.stringify({ error: "Ошибка ИИ-сервера" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
