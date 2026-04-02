"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface AccountItem {
  id:       string;
  name:     string;
  type:     string;
  balance:  number;
  currency: string;
}

interface DebtItem {
  id:          string;
  amount:      number;
  description: string | null;
  date:        string;
  counterparty: { id: string; name: string } | null;
}

interface BalanceData {
  asOf: string;
  assets: {
    cash:        { total: number; items: AccountItem[] };
    receivables: { total: number; items: DebtItem[] };
    total:       number;
  };
  liabilities: {
    payables: { total: number; items: DebtItem[] };
    total:    number;
  };
  equity:   number;
  balanced: boolean;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  BANK:    "Банк",
  CASH:    "Касса",
  CARD:    "Карта",
  EWALLET: "Эл. кошелёк",
};

interface EquityPoint {
  month:  string;
  equity: number;
  cash:   number;
}

export function BalanceClient() {
  const [date,         setDate]         = useState(() => new Date().toISOString().slice(0, 10));
  const [data,         setData]         = useState<BalanceData | null>(null);
  const [equityPoints, setEquityPoints] = useState<EquityPoint[]>([]);
  const [loading,      setLoading]      = useState(true);

  const fetchData = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const [balRes, histRes] = await Promise.all([
        fetch(`/api/reports/balance?date=${d}`),
        fetch("/api/reports/equity-history"),
      ]);
      const [balJson, histJson] = await Promise.all([balRes.json(), histRes.json()]);
      setData(balJson);
      setEquityPoints(histJson.points ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(date); }, [date, fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Балансовый отчёт</h1>
          <p className="text-sm text-gray-500 mt-0.5">Активы, обязательства и капитал компании</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { assets, liabilities, equity, balanced } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Балансовый отчёт</h1>
          <p className="text-sm text-gray-500 mt-0.5">Активы, обязательства и капитал компании</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">На дату:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Balance check */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
        balanced ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
      }`}>
        {balanced
          ? <><CheckCircle className="w-4 h-4" /> Баланс сходится: Активы = Пассивы + Капитал ({formatCurrency(assets.total)})</>
          : <><AlertTriangle className="w-4 h-4" /> Баланс не сходится — проверьте данные</>
        }
      </div>

      {/* Two-column balance sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ASSETS */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#0E9F6E] flex items-center justify-between">
              <span>АКТИВЫ</span>
              <span>{formatCurrency(assets.total)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cash */}
            <div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">Денежные средства</span>
                <span className="text-sm font-semibold">{formatCurrency(assets.cash.total)}</span>
              </div>
              {assets.cash.items.map((a) => (
                <div key={a.id} className="flex justify-between items-center py-1.5 pl-4">
                  <div>
                    <span className="text-sm text-gray-600">{a.name}</span>
                    <span className="text-xs text-gray-400 ml-1.5">{ACCOUNT_TYPE_LABELS[a.type]}</span>
                  </div>
                  <span className="text-sm">{formatCurrency(Number(a.balance))}</span>
                </div>
              ))}
            </div>

            {/* Receivables */}
            <div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">Дебиторская задолженность</span>
                <span className="text-sm font-semibold">{formatCurrency(assets.receivables.total)}</span>
              </div>
              {assets.receivables.items.length === 0 ? (
                <p className="text-xs text-gray-400 pl-4 py-1.5">Нет дебиторской задолженности</p>
              ) : assets.receivables.items.slice(0, 5).map((t) => (
                <div key={t.id} className="flex justify-between items-center py-1.5 pl-4">
                  <div>
                    <span className="text-sm text-gray-600">
                      {t.counterparty?.name ?? t.description ?? "Без контрагента"}
                    </span>
                    <span className="text-xs text-gray-400 ml-1.5">
                      до {formatDate(new Date(t.date))}
                    </span>
                  </div>
                  <span className="text-sm">{formatCurrency(t.amount)}</span>
                </div>
              ))}
              {assets.receivables.items.length > 5 && (
                <p className="text-xs text-gray-400 pl-4 py-1.5">
                  +{assets.receivables.items.length - 5} ещё
                </p>
              )}
            </div>

            {/* Inventory placeholder */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Товарные запасы</span>
              <span className="text-sm font-semibold">{formatCurrency(0)}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t-2 border-gray-200">
              <span className="font-bold text-sm">ИТОГО АКТИВЫ</span>
              <span className="font-bold text-[#0E9F6E]">{formatCurrency(assets.total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* LIABILITIES + EQUITY */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1A56DB] flex items-center justify-between">
              <span>ПАССИВЫ</span>
              <span>{formatCurrency(liabilities.total + equity)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payables */}
            <div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">Кредиторская задолженность</span>
                <span className="text-sm font-semibold">{formatCurrency(liabilities.payables.total)}</span>
              </div>
              {liabilities.payables.items.length === 0 ? (
                <p className="text-xs text-gray-400 pl-4 py-1.5">Нет кредиторской задолженности</p>
              ) : liabilities.payables.items.slice(0, 5).map((t) => (
                <div key={t.id} className="flex justify-between items-center py-1.5 pl-4">
                  <div>
                    <span className="text-sm text-gray-600">
                      {t.counterparty?.name ?? t.description ?? "Без контрагента"}
                    </span>
                    <span className="text-xs text-gray-400 ml-1.5">
                      до {formatDate(new Date(t.date))}
                    </span>
                  </div>
                  <span className="text-sm">{formatCurrency(t.amount)}</span>
                </div>
              ))}
              {liabilities.payables.items.length > 5 && (
                <p className="text-xs text-gray-400 pl-4 py-1.5">
                  +{liabilities.payables.items.length - 5} ещё
                </p>
              )}
            </div>

            {/* Equity */}
            <div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">Собственный капитал</span>
                <span className={`text-sm font-semibold ${equity >= 0 ? "text-[#0E9F6E]" : "text-[#E02424]"}`}>
                  {formatCurrency(equity)}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t-2 border-gray-200">
              <span className="font-bold text-sm">ИТОГО ПАССИВЫ + СК</span>
              <span className="font-bold text-[#1A56DB]">
                {formatCurrency(liabilities.total + equity)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equity dynamics — 12 months */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Динамика собственного капитала (12 месяцев)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {equityPoints.length === 0 || equityPoints.every((p) => p.equity === 0 && p.cash === 0) ? (
            <div className="flex flex-col items-center justify-center h-[220px] text-gray-400">
              <p className="text-sm font-medium">Нет данных для отображения</p>
              <p className="text-xs mt-1">Добавьте транзакции, чтобы увидеть динамику капитала</p>
            </div>
          ) : (
          <>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={equityPoints}
              margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false} tickLine={false}
                tick={{ fontSize: 11, fill: "#6B7280" }}
              />
              <YAxis
                axisLine={false} tickLine={false}
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
              />
              <Tooltip
                formatter={(v: number, name: string) => [
                  formatCurrency(v),
                  name === "equity" ? "Капитал" : "Денежные средства",
                ]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Line
                dataKey="cash"
                stroke="#CBD5E1"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                name="cash"
              />
              <Line
                dataKey="equity"
                stroke="#1A56DB"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#1A56DB" }}
                activeDot={{ r: 5 }}
                name="equity"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 justify-center">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-0.5 bg-[#1A56DB] inline-block rounded" />
              Собственный капитал
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-0.5 bg-gray-300 inline-block rounded" style={{ borderTop: "2px dashed #CBD5E1", background: "none" }} />
              Денежные средства
            </span>
          </div>
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
