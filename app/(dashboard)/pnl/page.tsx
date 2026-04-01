import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, getCurrentMonthRange, getPreviousMonthRange, getPercentChange } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PnlRow {
  label: string;
  current: number;
  prev: number;
  isTotal?: boolean;
  indent?: boolean;
  type?: "positive" | "negative" | "neutral";
}

function PnlRow({ row }: { row: PnlRow }) {
  const change = getPercentChange(row.current, row.prev);
  const isUp = change > 0;
  const isDown = change < 0;

  return (
    <tr className={`border-b last:border-0 ${row.isTotal ? "bg-gray-50 font-semibold" : "hover:bg-gray-50/50"}`}>
      <td className={`py-3 text-sm ${row.indent ? "pl-8 text-gray-600" : "font-medium"}`}>
        {row.label}
      </td>
      <td className={`py-3 text-right text-sm ${row.type === "positive" ? "text-[#0E9F6E]" : row.type === "negative" ? "text-[#E02424]" : ""}`}>
        {formatCurrency(row.current)}
      </td>
      <td className="py-3 text-right text-sm text-gray-500">
        {formatCurrency(row.prev)}
      </td>
      <td className="py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {isUp ? (
            <TrendingUp className="w-3 h-3 text-green-500" />
          ) : isDown ? (
            <TrendingDown className="w-3 h-3 text-red-500" />
          ) : (
            <Minus className="w-3 h-3 text-gray-400" />
          )}
          <span className={`text-xs ${isUp ? "text-green-500" : isDown ? "text-red-500" : "text-gray-400"}`}>
            {isUp ? "+" : ""}{change}%
          </span>
        </div>
      </td>
    </tr>
  );
}

export default async function PnlPage() {
  const session = await auth();
  if (!session) return null;

  const orgId = session.user.organizationId;
  const { start, end } = getCurrentMonthRange();
  const { start: prevStart, end: prevEnd } = getPreviousMonthRange();

  const [currentTx, prevTx] = await Promise.all([
    prisma.transaction.findMany({
      where: { organizationId: orgId, date: { gte: start, lte: end }, isConfirmed: true },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: { organizationId: orgId, date: { gte: prevStart, lte: prevEnd }, isConfirmed: true },
      include: { category: true },
    }),
  ]);

  const calcTotals = (txs: typeof currentTx) => {
    const income = txs.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
    const expense = txs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, profit: income - expense };
  };

  const curr = calcTotals(currentTx);
  const prev = calcTotals(prevTx);

  const rows: PnlRow[] = [
    { label: "Выручка", current: curr.income, prev: prev.income, type: "positive" },
    { label: "Себестоимость", current: 0, prev: 0, indent: true, type: "negative" },
    { label: "Валовая прибыль", current: curr.income, prev: prev.income, isTotal: true },
    { label: "Операционные расходы", current: curr.expense, prev: prev.expense, type: "negative" },
    { label: "EBITDA", current: curr.income - curr.expense, prev: prev.income - prev.expense, isTotal: true },
    { label: "Амортизация", current: 0, prev: 0, indent: true, type: "negative" },
    { label: "Чистая прибыль", current: curr.profit, prev: prev.profit, isTotal: true, type: curr.profit >= 0 ? "positive" : "negative" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ОПиУ — Отчёт о прибылях и убытках</h1>
        <p className="text-sm text-gray-500 mt-1">Финансовые результаты по методу начисления</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Выручка</p>
            <p className="text-2xl font-bold text-[#0E9F6E] mt-1">{formatCurrency(curr.income)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Расходы</p>
            <p className="text-2xl font-bold text-[#FF8C00] mt-1">{formatCurrency(curr.expense)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Чистая прибыль</p>
            <p className={`text-2xl font-bold mt-1 ${curr.profit >= 0 ? "text-[#0E9F6E]" : "text-[#E02424]"}`}>
              {formatCurrency(curr.profit)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Отчёт о прибылях и убытках</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b text-gray-500 text-sm">
                <th className="text-left py-2 font-medium">Показатель</th>
                <th className="text-right py-2 font-medium">Текущий месяц</th>
                <th className="text-right py-2 font-medium">Прошлый месяц</th>
                <th className="text-right py-2 font-medium">Изменение</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <PnlRow key={row.label} row={row} />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
