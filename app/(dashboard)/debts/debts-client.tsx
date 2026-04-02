"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ChevronDown, ChevronRight, AlertTriangle, CreditCard, Bell, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DebtItem {
  id:          string;
  date:        string;
  amount:      number;
  description: string | null;
  category:    { id: string; name: string } | null;
  isOverdue:   boolean;
}

interface CounterpartyGroup {
  counterpartyId: string | null;
  name:           string;
  total:          number;
  overdue:        number;
  items:          DebtItem[];
}

interface DebtsData {
  receivables: { total: number; overdue: number; byCounterparty: CounterpartyGroup[] };
  payables:    { total: number; overdue: number; byCounterparty: CounterpartyGroup[] };
}

function KpiCard({ label, value, sub, danger }: { label: string; value: string; sub?: string; danger?: boolean }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-lg font-bold mt-1 ${danger ? "text-[#E02424]" : "text-gray-800"}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function GroupRow({
  group,
  actionLabel,
  onConfirm,
  onRemind,
}: {
  group:       CounterpartyGroup;
  actionLabel: string;
  onConfirm:   (id: string) => void;
  onRemind:    (group: CounterpartyGroup, item: DebtItem) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Group header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-semibold"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <span>{group.name}</span>
          {group.overdue > 0 && (
            <span className="flex items-center gap-1 text-xs text-[#E02424] font-medium">
              <AlertTriangle className="w-3 h-3" /> Просрочено
            </span>
          )}
        </div>
        <span className="font-semibold">{formatCurrency(group.total)}</span>
      </button>

      {/* Items */}
      {open && (
        <div>
          {group.items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between px-4 py-3 border-t text-sm",
                item.isOverdue && "border-l-4 border-l-[#E02424]"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-gray-700 truncate">{item.description ?? "—"}</p>
                <p className={cn("text-xs mt-0.5", item.isOverdue ? "text-[#E02424] font-medium" : "text-gray-400")}>
                  {item.isOverdue ? "⚠ Просрочено · " : "Срок: "}
                  {formatDate(new Date(item.date))}
                  {item.category && <span className="ml-2 text-gray-400">{item.category.name}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <span className="font-semibold">{formatCurrency(item.amount)}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onConfirm(item.id)}
                >
                  {actionLabel}
                </Button>
                {item.isOverdue && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-gray-400 hover:text-[#1A56DB]"
                    onClick={() => onRemind(group, item)}
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type SortField = "name" | "total" | "date";
type SortDir   = "asc" | "desc";

function sortGroups(groups: CounterpartyGroup[], field: SortField, dir: SortDir) {
  return [...groups].sort((a, b) => {
    let cmp = 0;
    if (field === "name")  cmp = a.name.localeCompare(b.name, "ru");
    if (field === "total") cmp = a.total - b.total;
    if (field === "date") {
      const aMin = Math.min(...a.items.map((i) => new Date(i.date).getTime()));
      const bMin = Math.min(...b.items.map((i) => new Date(i.date).getTime()));
      cmp = aMin - bMin;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

function sortItems(items: DebtItem[], field: SortField, dir: SortDir) {
  return [...items].sort((a, b) => {
    let cmp = 0;
    if (field === "name")  cmp = (a.description ?? "").localeCompare(b.description ?? "", "ru");
    if (field === "total") cmp = a.amount - b.amount;
    if (field === "date")  cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
    return dir === "asc" ? cmp : -cmp;
  });
}

export function DebtsClient() {
  const [tab,      setTab]      = useState<"receivables" | "payables">("receivables");
  const [data,     setData]     = useState<DebtsData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir,   setSortDir]   = useState<SortDir>("asc");

  // Remind dialog
  const [remindDialog, setRemindDialog] = useState<{ group: CounterpartyGroup; item: DebtItem } | null>(null);
  const [copied,       setCopied]       = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/debts");
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleConfirm = async (id: string) => {
    await fetch(`/api/transactions/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isConfirmed: true, isPlanned: false }),
    });
    void fetchData();
  };

  const remindText = remindDialog
    ? `Добрый день, ${remindDialog.group.name}!\n\nНапоминаем о задолженности на сумму ${formatCurrency(remindDialog.item.amount)}.\nОписание: ${remindDialog.item.description ?? "—"}\nСрок: ${formatDate(new Date(remindDialog.item.date))}\n\nПросим произвести оплату в ближайшее время.\n\nС уважением,`
    : "";

  const handleCopy = () => {
    void navigator.clipboard.writeText(remindText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Обязательства</h1>
          <p className="text-sm text-gray-500 mt-0.5">Дебиторская и кредиторская задолженность</p>
        </div>
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const rawCurrent = tab === "receivables" ? data?.receivables : data?.payables;

  // Apply sorting to groups and their items
  const current = rawCurrent
    ? {
        ...rawCurrent,
        byCounterparty: sortGroups(rawCurrent.byCounterparty, sortField, sortDir).map((g) => ({
          ...g,
          items: sortItems(g.items, sortField, sortDir),
        })),
      }
    : undefined;

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Обязательства</h1>
        <p className="text-sm text-gray-500 mt-0.5">Дебиторская и кредиторская задолженность</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Нам должны (дебиторка)"
          value={formatCurrency(data?.receivables.total ?? 0)}
        />
        <KpiCard
          label="Просрочено дебиторов"
          value={formatCurrency(data?.receivables.overdue ?? 0)}
          sub="⚠️ от клиентов"
          danger={(data?.receivables.overdue ?? 0) > 0}
        />
        <KpiCard
          label="Мы должны (кредиторка)"
          value={formatCurrency(data?.payables.total ?? 0)}
        />
        <KpiCard
          label="Просрочено кредиторов"
          value={formatCurrency(data?.payables.overdue ?? 0)}
          sub="⚠️ поставщикам"
          danger={(data?.payables.overdue ?? 0) > 0}
        />
      </div>

      {/* Tabs + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {[
          { key: "receivables" as const, label: "Нам должны" },
          { key: "payables"    as const, label: "Мы должны"  },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              tab === t.key ? "bg-white text-[#1A56DB] shadow-sm" : "text-gray-600 hover:text-gray-800"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
        {(["date", "total", "name"] as SortField[]).map((f) => {
          const labels: Record<SortField, string> = { date: "Дата", total: "Сумма", name: "Контрагент" };
          const active = sortField === f;
          return (
            <button
              key={f}
              onClick={() => handleSort(f)}
              className={cn(
                "px-2.5 py-1 rounded border text-xs font-medium transition-colors",
                active
                  ? "border-[#1A56DB] text-[#1A56DB] bg-blue-50"
                  : "border-gray-200 text-gray-500 hover:border-gray-400"
              )}
            >
              {labels[f]}{active ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
            </button>
          );
        })}
      </div>
      </div>

      {/* Content */}
      {!current || current.byCounterparty.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {tab === "receivables" ? "Нет дебиторской задолженности" : "Нет кредиторской задолженности"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Здесь появятся плановые транзакции без подтверждения
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {current.byCounterparty.map((group) => (
            <GroupRow
              key={group.counterpartyId ?? "unknown"}
              group={group}
              actionLabel={tab === "receivables" ? "Получено" : "Оплачено"}
              onConfirm={handleConfirm}
              onRemind={(g, item) => { setRemindDialog({ group: g, item }); setCopied(false); }}
            />
          ))}
        </div>
      )}

      {/* Remind dialog */}
      <Dialog open={!!remindDialog} onOpenChange={(o) => !o && setRemindDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Напомнить контрагенту</DialogTitle>
          </DialogHeader>
          <div className="bg-gray-50 rounded-lg p-3 text-sm whitespace-pre-wrap text-gray-700 font-mono">
            {remindText}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemindDialog(null)}>Закрыть</Button>
            <Button className="bg-[#1A56DB] hover:bg-[#1A56DB]/90" onClick={handleCopy}>
              {copied ? "Скопировано ✓" : "Скопировать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
