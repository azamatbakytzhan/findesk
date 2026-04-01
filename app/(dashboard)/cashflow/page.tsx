import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { formatCurrency, getMonthShort } from "@/lib/utils";

export default async function CashflowPage() {
  const session = await auth();
  if (!session) return null;

  const orgId = session.user.organizationId;

  // Get last 6 months data
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    months.push({ start, end, label: getMonthShort(start.getMonth()) });
  }

  const monthlyData = await Promise.all(
    months.map(async ({ start, end, label }) => {
      const txs = await prisma.transaction.findMany({
        where: {
          organizationId: orgId,
          date: { gte: start, lte: end },
          isConfirmed: true,
        },
      });
      const income = txs
        .filter((t) => t.type === "INCOME")
        .reduce((s, t) => s + Number(t.amount), 0);
      const expense = txs
        .filter((t) => t.type === "EXPENSE")
        .reduce((s, t) => s + Number(t.amount), 0);
      return { month: label, income, expense };
    })
  );

  const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthlyData.reduce((s, m) => s + m.expense, 0);
  const netFlow = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ДДС — Движение денежных средств</h1>
        <p className="text-sm text-gray-500 mt-1">Анализ денежных потоков за последние 6 месяцев</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Итого доходы</p>
            <p className="text-2xl font-bold text-[#0E9F6E] mt-1">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Итого расходы</p>
            <p className="text-2xl font-bold text-[#FF8C00] mt-1">{formatCurrency(totalExpense)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Чистый поток</p>
            <p
              className={`text-2xl font-bold mt-1 ${netFlow >= 0 ? "text-[#0E9F6E]" : "text-[#E02424]"}`}
            >
              {formatCurrency(netFlow)}
            </p>
          </CardContent>
        </Card>
      </div>

      <CashflowChart data={monthlyData} />

      {/* Monthly table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Помесячный отчёт</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left py-2 font-medium">Месяц</th>
                <th className="text-right py-2 font-medium text-[#0E9F6E]">Доходы</th>
                <th className="text-right py-2 font-medium text-[#FF8C00]">Расходы</th>
                <th className="text-right py-2 font-medium">Поток</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m) => {
                const flow = m.income - m.expense;
                return (
                  <tr key={m.month} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 font-medium">{m.month}</td>
                    <td className="py-3 text-right text-[#0E9F6E]">{formatCurrency(m.income)}</td>
                    <td className="py-3 text-right text-[#FF8C00]">{formatCurrency(m.expense)}</td>
                    <td className={`py-3 text-right font-semibold ${flow >= 0 ? "text-[#0E9F6E]" : "text-[#E02424]"}`}>
                      {formatCurrency(flow)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="py-3">Итого</td>
                <td className="py-3 text-right text-[#0E9F6E]">{formatCurrency(totalIncome)}</td>
                <td className="py-3 text-right text-[#FF8C00]">{formatCurrency(totalExpense)}</td>
                <td className={`py-3 text-right ${netFlow >= 0 ? "text-[#0E9F6E]" : "text-[#E02424]"}`}>
                  {formatCurrency(netFlow)}
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
