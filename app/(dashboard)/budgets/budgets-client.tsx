"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Pencil, AlertTriangle, Target } from "lucide-react";

interface BudgetRow {
  id:           string;
  categoryId:   string | null;
  projectId:    string | null;
  categoryName: string;
  categoryType: string | null;
  planned:      number;
  actual:       number;
  delta:        number;
  deltaPercent: number;
  pct:          number;
}

interface Summary {
  totalPlanned: number;
  totalActual:  number;
  totalDelta:   number;
  execution:    number;
}

interface Category {
  id:   string;
  name: string;
  type: string;
}

interface Props {
  categories: Category[];
}

function monthLabel(period: string) {
  const [y, m] = period.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

function prevPeriod(p: string) {
  const [y, m] = p.split("-").map(Number) as [number, number];
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextPeriod(p: string) {
  const [y, m] = p.split("-").map(Number) as [number, number];
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentPeriod() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

function progressColor(pct: number) {
  if (pct > 100) return "bg-[#E02424]";
  if (pct > 90)  return "bg-[#FF8C00]";
  return "bg-[#0E9F6E]";
}

function deltaColor(delta: number, type: string | null) {
  // For expense: positive delta = overspend (bad), for income: positive = good
  const isExpense = type === "EXPENSE" || type === "OPERATIONAL";
  if (delta === 0) return "text-gray-500";
  if (isExpense)   return delta > 0 ? "text-[#E02424]" : "text-[#0E9F6E]";
  return delta > 0 ? "text-[#0E9F6E]" : "text-[#E02424]";
}

export function BudgetsClient({ categories }: Props) {
  const [period,  setPeriod]  = useState(currentPeriod);
  const [rows,    setRows]    = useState<BudgetRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  // Inline edit state
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [editValue,  setEditValue]  = useState("");

  // Add budget dialog
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newAmount,     setNewAmount]     = useState("");
  const [saving,        setSaving]        = useState(false);

  const fetchData = useCallback(async (p: string) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/budgets?period=${p}`);
      const json = await res.json();
      setRows(json.rows    ?? []);
      setSummary(json.summary ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(period); }, [period, fetchData]);

  const handleInlineSave = async (row: BudgetRow) => {
    const amount = parseFloat(editValue.replace(/\s/g, "").replace(",", "."));
    if (isNaN(amount) || amount <= 0) { setEditingId(null); return; }
    await fetch("/api/budgets", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ period, categoryId: row.categoryId, plannedAmount: amount }),
    });
    setEditingId(null);
    void fetchData(period);
  };

  const handleAddBudget = async () => {
    const amount = parseFloat(newAmount.replace(/\s/g, "").replace(",", "."));
    if (!newCategoryId || isNaN(amount) || amount <= 0) return;
    setSaving(true);
    try {
      await fetch("/api/budgets", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ period, categoryId: newCategoryId, plannedAmount: amount }),
      });
      setDialogOpen(false);
      setNewCategoryId("");
      setNewAmount("");
      void fetchData(period);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyFromPrev = async () => {
    const prev = prevPeriod(period);
    const res  = await fetch(`/api/budgets?period=${prev}`);
    const json = await res.json();
    for (const r of json.rows ?? []) {
      await fetch("/api/budgets", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ period, categoryId: r.categoryId, plannedAmount: r.planned }),
      });
    }
    void fetchData(period);
  };

  const chartData = rows.map((r) => ({
    name:    r.categoryName.length > 14 ? r.categoryName.slice(0, 14) + "…" : r.categoryName,
    План:    r.planned,
    Факт:    r.actual,
  }));

  const availableCategories = categories.filter(
    (c) => !rows.some((r) => r.categoryId === c.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Бюджеты</h1>
          <p className="text-sm text-gray-500 mt-0.5">Контроль плановых и фактических расходов</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyFromPrev}>
            Скопировать из прошлого
          </Button>
          <Button size="sm" className="bg-[#1A56DB] hover:bg-[#1A56DB]/90" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Добавить статью
          </Button>
        </div>
      </div>

      {/* Month picker */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setPeriod(prevPeriod)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold capitalize min-w-[160px] text-center">
          {monthLabel(period)}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setPeriod(nextPeriod)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* KPI cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "План",       value: formatCurrency(summary.totalPlanned), color: "text-gray-800" },
            { label: "Факт",       value: formatCurrency(summary.totalActual),  color: "text-[#1A56DB]" },
            {
              label: "Отклонение",
              value: (summary.totalDelta >= 0 ? "+" : "") + formatCurrency(summary.totalDelta),
              color: summary.totalDelta < 0 ? "text-[#0E9F6E]" : "text-[#E02424]",
            },
            { label: "Исполнение", value: `${summary.execution}%`, color: summary.execution > 100 ? "text-[#E02424]" : summary.execution > 90 ? "text-[#FF8C00]" : "text-[#0E9F6E]" },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">{kpi.label}</p>
                <p className={`text-lg font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Нет статей бюджета</p>
              <p className="text-sm text-gray-400 mt-1">Нажмите «Добавить статью» чтобы начать</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left py-3 px-4 font-medium">Статья</th>
                  <th className="text-right py-3 px-4 font-medium">План</th>
                  <th className="text-right py-3 px-4 font-medium">Факт</th>
                  <th className="text-right py-3 px-4 font-medium">Отклонение</th>
                  <th className="py-3 px-4 font-medium min-w-[160px]">Прогресс</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">{row.categoryName}</td>

                    {/* Inline editable plan */}
                    <td className="py-3 px-4 text-right">
                      {editingId === row.id ? (
                        <Input
                          autoFocus
                          className="h-7 w-28 text-right text-sm ml-auto"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => void handleInlineSave(row)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void handleInlineSave(row);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                      ) : (
                        <button
                          className="flex items-center gap-1 ml-auto hover:text-[#1A56DB] group"
                          onClick={() => { setEditingId(row.id); setEditValue(String(row.planned)); }}
                        >
                          <span>{formatCurrency(row.planned)}</span>
                          <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">{formatCurrency(row.actual)}</td>

                    <td className={`py-3 px-4 text-right font-medium ${deltaColor(row.delta, row.categoryType)}`}>
                      {row.delta > 0 && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                      {row.delta !== 0 ? (row.delta > 0 ? "+" : "") + formatCurrency(row.delta) : "—"}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${progressColor(row.pct)}`}
                            style={{ width: `${Math.min(row.pct, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold w-9 text-right ${
                          row.pct > 100 ? "text-[#E02424]" : row.pct > 90 ? "text-[#FF8C00]" : "text-[#0E9F6E]"
                        }`}>
                          {row.pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">График план-факт</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 10, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}К`}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [formatCurrency(v), name]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="План" fill="#CBD5E1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Факт" fill="#1A56DB" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Add budget dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить статью бюджета</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Категория</label>
              <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Плановая сумма (₸)</label>
              <Input
                className="mt-1"
                type="number"
                placeholder="500000"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button
              className="bg-[#1A56DB] hover:bg-[#1A56DB]/90"
              onClick={handleAddBudget}
              disabled={saving || !newCategoryId || !newAmount}
            >
              {saving ? "Сохранение…" : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
