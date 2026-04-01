import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CashflowChart, generateMockCashflowData } from "@/components/dashboard/cashflow-chart";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { getCurrentMonthRange, getPreviousMonthRange, getPercentChange } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const orgId = session.user.organizationId;
  const { start: monthStart, end: monthEnd } = getCurrentMonthRange();
  const { start: prevStart, end: prevEnd } = getPreviousMonthRange();

  const [accounts, currentMonthTx, prevMonthTx, recentTx, categories] =
    await Promise.all([
      prisma.account.findMany({
        where: { organizationId: orgId, isArchived: false },
      }),
      prisma.transaction.findMany({
        where: {
          organizationId: orgId,
          date: { gte: monthStart, lte: monthEnd },
          isConfirmed: true,
        },
      }),
      prisma.transaction.findMany({
        where: {
          organizationId: orgId,
          date: { gte: prevStart, lte: prevEnd },
          isConfirmed: true,
        },
      }),
      prisma.transaction.findMany({
        where: { organizationId: orgId },
        orderBy: { date: "desc" },
        take: 10,
        include: { category: true, account: true },
      }),
      prisma.category.findMany({
        where: { organizationId: orgId },
      }),
    ]);

  // KPI calculations
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  const currentIncome = currentMonthTx
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const currentExpense = currentMonthTx
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const currentProfit = currentIncome - currentExpense;

  const prevIncome = prevMonthTx
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const prevExpense = prevMonthTx
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const prevProfit = prevIncome - prevExpense;

  // Expense by category for donut chart
  const expenseByCategory = categories
    .filter((c) => c.type === "EXPENSE" || c.type === "OPERATIONAL")
    .map((cat) => {
      const total = currentMonthTx
        .filter((t) => t.type === "EXPENSE" && t.categoryId === cat.id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { name: cat.name, value: total };
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((c, i) => ({
      ...c,
      color: ["#1A56DB", "#0E9F6E", "#FF8C00", "#E02424", "#7C3AED"][i] ?? "#999",
    }));

  const cashflowData = generateMockCashflowData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
        <p className="text-sm text-gray-500 mt-1">
          Обзор финансовых показателей вашей компании
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Общий баланс"
          value={totalBalance}
          icon={Wallet}
          iconColor="text-[#1A56DB]"
          iconBg="bg-blue-50"
        />
        <KpiCard
          title="Доходы за месяц"
          value={currentIncome}
          change={getPercentChange(currentIncome, prevIncome)}
          icon={TrendingUp}
          iconColor="text-[#0E9F6E]"
          iconBg="bg-green-50"
          valueColor="text-[#0E9F6E]"
        />
        <KpiCard
          title="Расходы за месяц"
          value={currentExpense}
          change={getPercentChange(currentExpense, prevExpense)}
          icon={TrendingDown}
          iconColor="text-[#FF8C00]"
          iconBg="bg-orange-50"
          valueColor="text-[#FF8C00]"
        />
        <KpiCard
          title="Прибыль за месяц"
          value={currentProfit}
          change={getPercentChange(currentProfit, prevProfit)}
          icon={DollarSign}
          iconColor={currentProfit >= 0 ? "text-[#0E9F6E]" : "text-[#E02424]"}
          iconBg={currentProfit >= 0 ? "bg-green-50" : "bg-red-50"}
          valueColor={currentProfit >= 0 ? "text-[#0E9F6E]" : "text-[#E02424]"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CashflowChart data={cashflowData} />
        </div>
        <div>
          <ExpenseChart
            data={
              expenseByCategory.length > 0
                ? expenseByCategory
                : [
                    { name: "Зарплата", value: 800000, color: "#1A56DB" },
                    { name: "Аренда", value: 300000, color: "#0E9F6E" },
                    { name: "Маркетинг", value: 200000, color: "#FF8C00" },
                    { name: "Офис", value: 100000, color: "#E02424" },
                    { name: "Прочее", value: 50000, color: "#7C3AED" },
                  ]
            }
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <RecentTransactions
        transactions={recentTx.map((t) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          description: t.description,
          date: t.date,
          category: t.category ? { name: t.category.name } : null,
          account: { name: t.account.name },
        }))}
      />
    </div>
  );
}
