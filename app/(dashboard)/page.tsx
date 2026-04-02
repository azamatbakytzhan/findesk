import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, TrendingUp, TrendingDown, DollarSign, CalendarClock,
} from "lucide-react";
import {
  getCurrentMonthRange, getPreviousMonthRange, getPercentChange,
  formatCurrency, formatDate, getMonthShort,
} from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const orgId = session.user.organizationId;
  const { start: monthStart, end: monthEnd }   = getCurrentMonthRange();
  const { start: prevStart,  end: prevEnd }    = getPreviousMonthRange();

  // Build 6-month cashflow data
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    accounts,
    currentMonthTx,
    prevMonthTx,
    recentTx,
    categories,
    cashflowTx,
    upcomingPayments,
    pendingApprovals,
  ] = await Promise.all([
    prisma.account.findMany({ where: { organizationId: orgId, isArchived: false } }),
    prisma.transaction.findMany({
      where: { organizationId: orgId, date: { gte: monthStart, lte: monthEnd }, isConfirmed: true, isPlanned: false },
    }),
    prisma.transaction.findMany({
      where: { organizationId: orgId, date: { gte: prevStart, lte: prevEnd }, isConfirmed: true, isPlanned: false },
    }),
    prisma.transaction.findMany({
      where: { organizationId: orgId, isPlanned: false },
      orderBy: { date: "desc" },
      take: 8,
      include: { category: true, account: true },
    }),
    prisma.category.findMany({ where: { organizationId: orgId } }),
    // Last 6 months of confirmed transactions for cashflow chart
    prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        isConfirmed: true,
        isPlanned:   false,
        date:        { gte: sixMonthsAgo, lte: now },
        type:        { in: ["INCOME", "EXPENSE"] },
      },
      select: { date: true, type: true, amount: true },
    }),
    // Upcoming planned transactions (next 7 days)
    prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        isPlanned: true,
        date:      { gte: now },
      },
      include: { category: { select: { name: true } } },
      orderBy: { date: "asc" },
      take: 5,
    }),
    // Pending payment requests
    prisma.paymentRequest.count({
      where: { organizationId: orgId, status: "PENDING" },
    }),
  ]);

  // KPI calculations
  const totalBalance    = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const currentIncome   = currentMonthTx.filter((t) => t.type === "INCOME" ).reduce((s, t) => s + Number(t.amount), 0);
  const currentExpense  = currentMonthTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
  const currentProfit   = currentIncome - currentExpense;
  const prevIncome      = prevMonthTx.filter((t) => t.type === "INCOME" ).reduce((s, t) => s + Number(t.amount), 0);
  const prevExpense     = prevMonthTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
  const prevProfit      = prevIncome - prevExpense;

  // Expense by category for donut
  const expenseByCategory = categories
    .filter((c) => c.type === "EXPENSE" || c.type === "OPERATIONAL")
    .map((cat) => ({
      name:  cat.name,
      value: currentMonthTx
        .filter((t) => t.type === "EXPENSE" && t.categoryId === cat.id)
        .reduce((s, t) => s + Number(t.amount), 0),
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((c, i) => ({
      ...c,
      color: ["#1A56DB", "#0E9F6E", "#FF8C00", "#E02424", "#7C3AED"][i] ?? "#999",
    }));

  // Build real 6-month cashflow chart data
  const cashflowData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthTx = cashflowTx.filter((t) => {
      const td = new Date(t.date);
      return td.getMonth() === m && td.getFullYear() === y;
    });
    return {
      month:   getMonthShort(m),
      income:  monthTx.filter((t) => t.type === "INCOME" ).reduce((s, t) => s + Number(t.amount), 0),
      expense: monthTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
        <p className="text-sm text-gray-500 mt-1">Обзор финансовых показателей</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Общий баланс"    value={totalBalance}    icon={Wallet}      iconColor="text-[#1A56DB]" iconBg="bg-blue-50" />
        <KpiCard title="Доходы за месяц" value={currentIncome}  change={getPercentChange(currentIncome,  prevIncome)}  icon={TrendingUp}   iconColor="text-[#0E9F6E]" iconBg="bg-green-50"  valueColor="text-[#0E9F6E]" />
        <KpiCard title="Расходы за месяц" value={currentExpense} change={getPercentChange(currentExpense, prevExpense)} icon={TrendingDown}  iconColor="text-[#FF8C00]" iconBg="bg-orange-50" valueColor="text-[#FF8C00]" />
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
                    { name: "Зарплата",  value: 800000,  color: "#1A56DB" },
                    { name: "Аренда",    value: 300000,  color: "#0E9F6E" },
                    { name: "Маркетинг", value: 200000,  color: "#FF8C00" },
                    { name: "Офис",      value: 100000,  color: "#E02424" },
                    { name: "Прочее",    value: 50000,   color: "#7C3AED" },
                  ]
            }
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent transactions — 2 cols */}
        <div className="lg:col-span-2">
          <RecentTransactions
            transactions={recentTx.map((t) => ({
              id:          t.id,
              type:        t.type,
              amount:      Number(t.amount),
              description: t.description,
              date:        t.date,
              category:    t.category ? { name: t.category.name } : null,
              account:     { name: t.account.name },
            }))}
          />
        </div>

        {/* Upcoming payments — 1 col */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-[#FF8C00]" />
              Ближайшие платежи
              {pendingApprovals > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs">
                  {pendingApprovals} заявок
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingPayments.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Нет предстоящих платежей</p>
            ) : (
              upcomingPayments.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate">
                      {tx.description ?? tx.category?.name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                  </div>
                  <span className={`text-sm font-semibold ml-3 shrink-0 ${
                    tx.type === "INCOME" ? "text-[#0E9F6E]" : "text-[#E02424]"
                  }`}>
                    {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
