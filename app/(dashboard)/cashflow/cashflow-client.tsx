"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Line, ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import { Download, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Account { id: string; name: string }

interface CfRow {
  id: string; name: string; isGroup: boolean;
  type: "INCOME" | "EXPENSE"; indent: number;
  values: number[]; total: number;
}

interface CashflowData {
  months: string[];
  rows: CfRow[];
  summary: { income: number[]; expense: number[]; netFlow: number[] };
}

interface Props { accounts: Account[] }

const now = new Date();
const DEFAULT_FROM = `${now.getFullYear()}-01-01`;
const DEFAULT_TO   = `${now.getFullYear()}-12-31`;

export function CashflowClient({ accounts }: Props) {
  const [dateFrom,  setDateFrom]  = useState(DEFAULT_FROM);
  const [dateTo,    setDateTo]    = useState(DEFAULT_TO);
  const [accountId, setAccountId] = useState("");
  const [data,      setData]      = useState<CashflowData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ dateFrom, dateTo });
      if (accountId) p.set("accountId", accountId);
      const res  = await fetch(`/api/reports/cashflow?${p}`);
      const json = await res.json() as CashflowData;
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, accountId]);

  useEffect(() => { void load(); }, [load]);

  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleExport = () => {
    const p = new URLSearchParams({ dateFrom, dateTo });
    if (accountId) p.set("accountId", accountId);
    window.open(`/api/reports/cashflow/export?${p}`, "_blank");
  };

  // Chart data
  const chartData = data?.months.map((m, i) => ({
    month: m,
    income:  data.summary.income[i]  ?? 0,
    expense: data.summary.expense[i] ?? 0,
    netFlow: data.summary.netFlow[i] ?? 0,
  })) ?? [];

  const totalIncome  = data?.summary.income.reduce((s, v)  => s + v, 0) ?? 0;
  const totalExpense = data?.summary.expense.reduce((s, v) => s + v, 0) ?? 0;
  const totalNet     = totalIncome - totalExpense;

  // Decide row visibility: hide children of collapsed groups
  const visibleRows = data?.rows.filter((row) => {
    // Group header rows are always visible
    if (row.isGroup) return true;
    // Detail rows are hidden when their parent group is collapsed
    const parentGroup = row.type === "INCOME" ? "__income_group__" : "__expense_group__";
    return !collapsed.has(parentGroup);
  }) ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ДДС — Движение денежных средств</h1>
          <p className="text-sm text-gray-500 mt-0.5">Анализ и планирование денежных потоков</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={loading}>
          <Download className="w-4 h-4 mr-2" />
          Экспорт Excel
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">С:</span>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">По:</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
          </div>
          <Select value={accountId || "ALL"} onValueChange={(v) => setAccountId(v === "ALL" ? "" : v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Все счета" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Все счета</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-gray-500">Итого поступления</p>
              <p className="text-2xl font-bold text-[#0E9F6E] mt-1">{formatCurrency(totalIncome)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-gray-500">Итого платежи</p>
              <p className="text-2xl font-bold text-[#FF8C00] mt-1">{formatCurrency(totalExpense)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-gray-500">Чистый поток</p>
              <p className={cn("text-2xl font-bold mt-1", totalNet >= 0 ? "text-[#0E9F6E]" : "text-[#E02424]")}>
                {totalNet >= 0 ? "+" : ""}{formatCurrency(totalNet)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">График денежных потоков</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 10, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    formatCurrency(v),
                    name === "income" ? "Поступления" : name === "expense" ? "Платежи" : "Чистый поток",
                  ]}
                />
                <Legend formatter={(v) =>
                  v === "income" ? "Поступления" : v === "expense" ? "Платежи" : "Чистый поток"
                } wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income"  fill="#0E9F6E" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expense" fill="#FF8C00" radius={[3, 3, 0, 0]} />
                <Line dataKey="netFlow" type="monotone" stroke="#1A56DB" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-base font-semibold">Детализация по статьям</CardTitle>
        </CardHeader>
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        ) : !data || data.rows.length === 0 ? (
          <CardContent className="py-12 text-center text-gray-400 text-sm">
            Нет данных за выбранный период
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 sticky left-0 bg-gray-50 min-w-[200px]">
                    Статья
                  </th>
                  {data.months.map((m) => (
                    <th key={m} className="text-right px-3 py-3 font-medium text-gray-600 whitespace-nowrap min-w-[110px]">
                      {m}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 font-semibold text-gray-800 whitespace-nowrap min-w-[120px]">
                    ИТОГО
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const isIncomeGroup  = row.id === "__income_group__";
                  const isExpenseGroup = row.id === "__expense_group__";
                  const isTopGroup     = isIncomeGroup || isExpenseGroup;
                  const isCollapsed    = collapsed.has(row.id);

                  return (
                    <tr
                      key={row.id}
                      onClick={() => isTopGroup ? toggleCollapse(row.id) : undefined}
                      className={cn(
                        "border-b last:border-0 transition-colors",
                        isTopGroup
                          ? "bg-gray-50 cursor-pointer hover:bg-gray-100 font-semibold"
                          : "hover:bg-gray-50/70",
                      )}
                    >
                      <td className={cn(
                        "px-4 py-2.5 sticky left-0",
                        isTopGroup ? "bg-gray-50" : "bg-white",
                      )}>
                        <div className="flex items-center gap-1.5"
                             style={{ paddingLeft: row.indent * 16 }}>
                          {isTopGroup && (
                            isCollapsed
                              ? <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                              : <ChevronDown  className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          )}
                          <span className={cn(
                            isTopGroup ? "text-gray-900" : "text-gray-700",
                          )}>
                            {row.name}
                          </span>
                        </div>
                      </td>
                      {row.values.map((v, i) => (
                        <td key={i} className={cn(
                          "text-right px-3 py-2.5 tabular-nums",
                          v < 0 ? "text-[#E02424]" : v > 0 ? "text-gray-800" : "text-gray-400",
                        )}>
                          {v !== 0 ? formatCurrency(v) : "—"}
                        </td>
                      ))}
                      <td className={cn(
                        "text-right px-4 py-2.5 tabular-nums font-semibold",
                        row.total < 0 ? "text-[#E02424]" : "text-gray-900",
                      )}>
                        {row.total !== 0 ? formatCurrency(row.total) : "—"}
                      </td>
                    </tr>
                  );
                })}

                {/* Net flow footer */}
                <tr className="border-t-2 bg-blue-50 font-semibold">
                  <td className="px-4 py-3 sticky left-0 bg-blue-50 text-gray-900">
                    ЧИСТЫЙ ПОТОК
                  </td>
                  {data.summary.netFlow.map((v, i) => (
                    <td key={i} className={cn(
                      "text-right px-3 py-3 tabular-nums",
                      v >= 0 ? "text-[#0E9F6E]" : "text-[#E02424]",
                    )}>
                      {v >= 0 ? "+" : ""}{formatCurrency(v)}
                    </td>
                  ))}
                  <td className={cn(
                    "text-right px-4 py-3 tabular-nums",
                    totalNet >= 0 ? "text-[#0E9F6E]" : "text-[#E02424]",
                  )}>
                    {totalNet >= 0 ? "+" : ""}{formatCurrency(totalNet)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
