"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PnlRow {
  key: string; label: string;
  values: number[]; total: number;
  isCalculated: boolean; sign: number; isPercent?: boolean;
}

interface PnlData {
  months: string[];
  rows: PnlRow[];
  totals: {
    revenue: number; expenses: number; grossProfit: number;
    ebitda: number; netProfit: number; margin: number;
  };
}

const DIVIDERS_BEFORE = new Set(["grossProfit", "ebitda", "netProfit", "margin"]);

const now = new Date();
const DEFAULT_FROM = `${now.getFullYear()}-01-01`;
const DEFAULT_TO   = `${now.getFullYear()}-12-31`;

export function PnlClient() {
  const [dateFrom, setDateFrom] = useState(DEFAULT_FROM);
  const [dateTo,   setDateTo]   = useState(DEFAULT_TO);
  const [data,     setData]     = useState<PnlData | null>(null);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ dateFrom, dateTo });
      const res  = await fetch(`/api/reports/pnl?${p}`);
      const json = await res.json() as PnlData;
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { void load(); }, [load]);

  const chartData = data?.months.map((m, i) => {
    const netRow = data.rows.find((r) => r.key === "netProfit");
    const revRow = data.rows.find((r) => r.key === "revenue");
    return {
      month: m,
      netProfit: netRow?.values[i] ?? 0,
      revenue:   revRow?.values[i] ?? 0,
    };
  }) ?? [];

  const t = data?.totals;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ОПиУ — Отчёт о прибылях и убытках</h1>
          <p className="text-sm text-gray-500 mt-0.5">Финансовые результаты по методу начисления</p>
        </div>
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
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Выручка",       value: t?.revenue    ?? 0, color: "text-[#0E9F6E]" },
            { label: "Валовая прибыль", value: t?.grossProfit ?? 0, color: "text-[#1A56DB]" },
            { label: "EBITDA",        value: t?.ebitda     ?? 0, color: (t?.ebitda ?? 0) >= 0 ? "text-[#1A56DB]" : "text-[#E02424]" },
            { label: "Чистая прибыль", value: t?.netProfit  ?? 0, color: (t?.netProfit ?? 0) >= 0 ? "text-[#0E9F6E]" : "text-[#E02424]" },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className={cn("text-2xl font-bold mt-1", kpi.color)}>
                  {formatCurrency(kpi.value)}
                </p>
                {kpi.label === "Чистая прибыль" && t && (
                  <p className="text-xs text-gray-500 mt-1">
                    Маржа: {t.margin}%
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Line chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Динамика прибыли</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number, name: string) => [
                  formatCurrency(v),
                  name === "netProfit" ? "Чистая прибыль" : "Выручка",
                ]} />
                <ReferenceLine y={0} stroke="#E02424" strokeDasharray="4 2" />
                <Line dataKey="revenue"   type="monotone" stroke="#1A56DB" strokeWidth={2} dot={{ r: 3 }} name="revenue" />
                <Line dataKey="netProfit" type="monotone" stroke="#0E9F6E" strokeWidth={2} dot={{ r: 3 }} name="netProfit" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* P&L Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-base font-semibold">Отчёт о прибылях и убытках</CardTitle>
        </CardHeader>
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        ) : !data ? null : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 sticky left-0 bg-gray-50 min-w-[220px]">
                    Показатель
                  </th>
                  {data.months.map((m) => (
                    <th key={m} className="text-right px-3 py-3 font-medium text-gray-600 whitespace-nowrap min-w-[110px]">
                      {m}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 font-semibold text-gray-800 min-w-[120px]">
                    ИТОГО
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => {
                  const isKey = row.isCalculated && ["grossProfit", "ebitda", "netProfit"].includes(row.key);
                  const hasDivider = DIVIDERS_BEFORE.has(row.key);
                  return (
                    <tr key={row.key} className={cn(
                      "border-b last:border-0 transition-colors",
                      isKey ? "bg-gray-50 font-semibold" : "hover:bg-gray-50/70",
                      hasDivider && "border-t-2 border-gray-200",
                    )}>
                      <td className={cn(
                        "px-4 py-2.5 sticky left-0",
                        isKey ? "bg-gray-50 text-gray-900" : "bg-white text-gray-700",
                        !isKey && !row.isCalculated && "pl-8 text-gray-600",
                      )}>
                        {row.label}
                      </td>
                      {row.values.map((v, i) => (
                        <td key={i} className={cn(
                          "text-right px-3 py-2.5 tabular-nums",
                          row.isPercent
                            ? v >= 0 ? "text-[#0E9F6E]" : "text-[#E02424]"
                            : v < 0 || (row.sign < 0 && v > 0)
                            ? "text-[#E02424]"
                            : v > 0 ? "text-gray-800" : "text-gray-400",
                        )}>
                          {v !== 0
                            ? row.isPercent
                              ? `${v}%`
                              : formatCurrency(v)
                            : "—"}
                        </td>
                      ))}
                      <td className={cn(
                        "text-right px-4 py-2.5 tabular-nums",
                        isKey ? "font-semibold" : "",
                        row.isPercent
                          ? row.total >= 0 ? "text-[#0E9F6E]" : "text-[#E02424]"
                          : row.total < 0 ? "text-[#E02424]" : "text-gray-900",
                      )}>
                        {row.total !== 0
                          ? row.isPercent ? `${row.total}%` : formatCurrency(row.total)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
