"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  AlertTriangle, CheckCircle, CalendarDays,
  ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
  Check, Calendar, List,
} from "lucide-react";

interface PlannedTx {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string | null;
  category: { id: string; name: string } | null;
  account: { id: string; name: string };
}

interface ForecastDay {
  date: string;
  balance: number;
  hasGap: boolean;
  transactions: PlannedTx[];
  confirmedCount: number;
}

interface CalendarData {
  forecast: ForecastDay[];
  currentBalance: number;
  totalPlanned: number;
  gapDays: number;
  summary: { plannedIncome: number; plannedExpense: number };
}

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function getMonthBounds(year: number, month: number) {
  const from = new Date(year, month, 1);
  const to   = new Date(year, month + 1, 0);
  return {
    dateFrom: from.toISOString().split("T")[0]!,
    dateTo:   to.toISOString().split("T")[0]!,
  };
}

export function CalendarClient() {
  const now = new Date();
  const [year,   setYear]   = useState(now.getFullYear());
  const [month,  setMonth]  = useState(now.getMonth());
  const [view,   setView]   = useState<"list" | "month">("list");
  const [data,   setData]   = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { dateFrom, dateTo } = getMonthBounds(year, month);
      const res  = await fetch(`/api/calendar?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      const json = await res.json() as CalendarData;
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { void load(); }, [load]);

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const handleConfirm = async (tx: PlannedTx) => {
    try {
      const res = await fetch(`/api/transactions/${tx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isConfirmed: true }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Операция подтверждена", description: `${formatCurrency(tx.amount)} зачислены на счёт` });
      void load();
    } catch {
      toast({ variant: "destructive", title: "Не удалось подтвердить операцию" });
    }
  };

  const handleDelete = async (txId: string) => {
    try {
      await fetch(`/api/transactions/${txId}`, { method: "DELETE" });
      toast({ title: "Плановая операция удалена" });
      void load();
    } catch {
      toast({ variant: "destructive", title: "Ошибка" });
    }
  };

  // Days with transactions for month view
  const daysWithTx = new Map<string, ForecastDay>();
  for (const d of data?.forecast ?? []) {
    if (d.transactions.length > 0 || d.hasGap) {
      daysWithTx.set(d.date.split("T")[0]!, d);
    }
  }

  // Month grid: days of the week, 1-indexed Mon=1
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon-based

  const gridCells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // pad to full weeks
  while (gridCells.length % 7 !== 0) gridCells.push(null);

  const activeDays = data?.forecast.filter((d) => d.transactions.length > 0) ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Платёжный календарь</h1>
          <p className="text-sm text-gray-500 mt-0.5">Плановые операции и прогноз баланса</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={cn(
                "px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors",
                view === "list" ? "bg-[#1A56DB] text-white" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <List className="w-3.5 h-3.5" /> Список
            </button>
            <button
              onClick={() => setView("month")}
              className={cn(
                "px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors border-l",
                view === "month" ? "bg-[#1A56DB] text-white" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Calendar className="w-3.5 h-3.5" /> Месяц
            </button>
          </div>
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold min-w-[180px] text-center">
          {MONTH_NAMES[month]} {year}
        </h2>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Текущий баланс</p>
              <p className={cn("text-xl font-bold mt-0.5",
                data.currentBalance >= 0 ? "text-[#0E9F6E]" : "text-[#E02424]")}>
                {formatCurrency(data.currentBalance)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Плановые поступления</p>
              <p className="text-xl font-bold mt-0.5 text-[#0E9F6E]">
                +{formatCurrency(data.summary.plannedIncome)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Плановые платежи</p>
              <p className="text-xl font-bold mt-0.5 text-[#FF8C00]">
                -{formatCurrency(data.summary.plannedExpense)}
              </p>
            </CardContent>
          </Card>
          <Card className={cn("border-0 shadow-sm", data.gapDays > 0 && "border border-red-200 bg-red-50")}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Кассовых разрывов</p>
              <p className={cn("text-xl font-bold mt-0.5", data.gapDays > 0 ? "text-[#E02424]" : "text-[#0E9F6E]")}>
                {data.gapDays > 0 ? (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {data.gapDays} {data.gapDays === 1 ? "день" : "дней"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Нет
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gap warning */}
      {!loading && data && data.gapDays > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">Внимание:</span> по прогнозу в {data.gapDays} дн.{" "}
            возможен кассовый разрыв. Пересмотрите плановые платежи или ожидайте поступлений.
          </p>
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : activeDays.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Нет плановых операций</p>
              <p className="text-sm text-gray-400 mt-1">
                Добавьте транзакцию с отметкой «плановая»
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeDays.map((day) => {
              const d      = new Date(day.date);
              const isToday = new Date().toDateString() === d.toDateString();
              const weekday = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"][d.getDay()]!;
              return (
                <Card key={day.date} className={cn(
                  "border-0 shadow-sm",
                  day.hasGap && "border border-red-200",
                )}>
                  <CardHeader className="py-3 px-4 border-b border-gray-50 flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex flex-col items-center justify-center leading-none",
                        isToday ? "bg-[#1A56DB] text-white" :
                        day.hasGap ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700",
                      )}>
                        <span className="text-[10px] font-medium">{weekday}</span>
                        <span className="text-sm font-bold">{d.getDate()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {d.getDate()} {MONTH_NAMES[d.getMonth()]?.toLowerCase()}
                          {isToday && <span className="ml-1.5 text-[#1A56DB] text-xs">(сегодня)</span>}
                        </p>
                        <p className={cn(
                          "text-xs font-medium",
                          day.hasGap ? "text-[#E02424]" : "text-gray-500",
                        )}>
                          {day.hasGap && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                          Прогноз остатка: {formatCurrency(day.balance)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {day.transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-50/50">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                          tx.type === "INCOME" ? "bg-green-100" : "bg-red-100",
                        )}>
                          {tx.type === "INCOME"
                            ? <ArrowUp className="w-3.5 h-3.5 text-green-600" />
                            : <ArrowDown className="w-3.5 h-3.5 text-red-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {tx.description ?? tx.category?.name ?? "Без описания"}
                          </p>
                          <p className="text-xs text-gray-500">{tx.account.name}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={cn(
                            "text-sm font-semibold",
                            tx.type === "INCOME" ? "text-[#0E9F6E]" : "text-[#E02424]",
                          )}>
                            {tx.type === "INCOME" ? "+" : "−"}{formatCurrency(tx.amount)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50"
                            onClick={() => handleConfirm(tx)}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Подтвердить
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-gray-400 hover:text-red-500"
                            onClick={() => handleDelete(tx.id)}
                          >
                            Удалить
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* MONTH VIEW */}
      {view === "month" && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {/* Day-of-week header */}
            <div className="grid grid-cols-7 border-b bg-gray-50">
              {DAY_NAMES.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">{d}</div>
              ))}
            </div>
            {/* Grid */}
            {loading ? (
              <div className="p-4">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {gridCells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-24 border-b border-r border-gray-100 bg-gray-50/50" />;
                  }
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const fd      = daysWithTx.get(dateStr);
                  const isToday =
                    day === now.getDate() &&
                    month === now.getMonth() &&
                    year  === now.getFullYear();

                  return (
                    <div key={dateStr} className={cn(
                      "h-24 border-b border-r border-gray-100 p-1.5 flex flex-col",
                      fd?.hasGap && "bg-red-50",
                    )}>
                      <span className={cn(
                        "text-xs font-medium self-start px-1 rounded",
                        isToday ? "bg-[#1A56DB] text-white" :
                        fd?.hasGap ? "text-red-600" : "text-gray-600",
                      )}>
                        {day}
                      </span>
                      {fd && fd.transactions.length > 0 && (
                        <div className="mt-1 space-y-0.5 overflow-hidden">
                          {fd.transactions.slice(0, 2).map((tx) => (
                            <div key={tx.id} className={cn(
                              "text-[10px] rounded px-1 py-0.5 truncate",
                              tx.type === "INCOME"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700",
                            )}>
                              {tx.type === "INCOME" ? "+" : "−"}
                              {(tx.amount / 1000).toFixed(0)}K
                            </div>
                          ))}
                          {fd.transactions.length > 2 && (
                            <p className="text-[10px] text-gray-400 px-1">
                              +{fd.transactions.length - 2} ещё
                            </p>
                          )}
                        </div>
                      )}
                      {fd?.balance !== undefined && (
                        <p className={cn(
                          "text-[10px] mt-auto self-end",
                          fd.hasGap ? "text-red-500 font-medium" : "text-gray-400",
                        )}>
                          {fd.hasGap && "⚠ "}
                          {formatCurrency(fd.balance)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
