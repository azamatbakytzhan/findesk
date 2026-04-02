"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Pencil, Zap, PlayCircle, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Condition {
  field:    string;
  operator: string;
  value:    string;
}

interface Action {
  field: string;
  value: string;
}

interface Rule {
  id:             string;
  name:           string;
  conditions:     Condition[];
  conditionLogic: string;
  actions:        Action[];
  priority:       number;
  isActive:       boolean;
}

interface Category { id: string; name: string; type: string }
interface Project  { id: string; name: string }

interface TestMatch {
  id:          string;
  date:        string;
  type:        string;
  amount:      number;
  description: string | null;
  account:     { name: string };
  category:    { name: string } | null;
}

// Client-side condition evaluation mirrors automation-engine.ts
function evalCondition(
  c: Condition,
  tx: { description: string | null; amount: number; accountId: string }
): boolean {
  const raw = (() => {
    switch (c.field) {
      case "description": return tx.description ?? "";
      case "amount":      return String(tx.amount);
      case "accountId":   return tx.accountId;
      default:            return "";
    }
  })();
  const fv = raw.toLowerCase();
  const cv = c.value.toLowerCase();
  switch (c.operator) {
    case "contains":    return fv.includes(cv);
    case "equals":      return fv === cv;
    case "startsWith":  return fv.startsWith(cv);
    case "greaterThan": return Number(raw) > Number(c.value);
    case "lessThan":    return Number(raw) < Number(c.value);
    default:            return false;
  }
}

interface Props {
  categories: Category[];
  projects:   Project[];
}

const FIELD_LABELS: Record<string, string> = {
  description:      "Описание",
  amount:           "Сумма",
  counterpartyName: "Контрагент",
  accountId:        "Счёт",
};

const OPERATOR_LABELS: Record<string, string> = {
  contains:    "содержит",
  equals:      "равно",
  startsWith:  "начинается с",
  greaterThan: "больше чем",
  lessThan:    "меньше чем",
};

const ACTION_FIELD_LABELS: Record<string, string> = {
  categoryId: "Установить категорию",
  projectId:  "Установить проект",
  tags:       "Добавить тег",
};

const EMPTY_CONDITION: Condition = { field: "description", operator: "contains", value: "" };
const EMPTY_ACTION:    Action    = { field: "categoryId",  value: "" };

const EMPTY_RULE = {
  name:           "",
  conditions:     [{ ...EMPTY_CONDITION }],
  conditionLogic: "AND",
  actions:        [{ ...EMPTY_ACTION }],
  priority:       0,
  isActive:       true,
};

export function AutomationClient({ categories, projects }: Props) {
  const [rules,   setRules]   = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog,  setDialog]  = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [form,    setForm]    = useState({ ...EMPTY_RULE });
  const [saving,   setSaving]   = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [testMatches, setTestMatches] = useState<TestMatch[] | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/automation");
      const json = await res.json();
      setRules(json ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRules(); }, [fetchRules]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_RULE, conditions: [{ ...EMPTY_CONDITION }], actions: [{ ...EMPTY_ACTION }] });
    setTestMatches(null);
    setDialog(true);
  };

  const openEdit = (rule: Rule) => {
    setEditing(rule);
    setForm({
      name:           rule.name,
      conditions:     rule.conditions.length > 0 ? rule.conditions : [{ ...EMPTY_CONDITION }],
      conditionLogic: rule.conditionLogic,
      actions:        rule.actions.length > 0 ? rule.actions : [{ ...EMPTY_ACTION }],
      priority:       rule.priority,
      isActive:       rule.isActive,
    });
    setTestMatches(null);
    setDialog(true);
  };

  const handleTest = async () => {
    const validConditions = form.conditions.filter((c) => c.value.trim());
    if (!validConditions.length) return;
    setTesting(true);
    setTestMatches(null);
    try {
      const res  = await fetch("/api/transactions?limit=50&page=1");
      const json = await res.json();
      const txs  = (json.transactions ?? []) as Array<{
        id: string; date: string; type: string; amount: number;
        description: string | null; accountId: string;
        account: { name: string }; category: { name: string } | null;
      }>;

      const matches = txs.filter((tx) => {
        const logic = form.conditionLogic;
        return logic === "OR"
          ? validConditions.some((c)  => evalCondition(c, tx))
          : validConditions.every((c) => evalCondition(c, tx));
      });

      setTestMatches(matches.slice(0, 10));
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const validConditions = form.conditions.filter((c) => c.value.trim());
      const validActions    = form.actions.filter((a) => a.value.trim());
      if (!validConditions.length || !validActions.length) return;

      const payload = { ...form, conditions: validConditions, actions: validActions };
      const url     = editing ? `/api/automation/${editing.id}` : "/api/automation";
      const method  = editing ? "PATCH" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      setDialog(false);
      void fetchRules();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить правило?")) return;
    await fetch(`/api/automation/${id}`, { method: "DELETE" });
    void fetchRules();
  };

  const handleToggle = async (rule: Rule) => {
    await fetch(`/api/automation/${rule.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isActive: !rule.isActive }),
    });
    void fetchRules();
  };

  const addCondition = () =>
    setForm((f) => ({ ...f, conditions: [...f.conditions, { ...EMPTY_CONDITION }] }));

  const removeCondition = (i: number) =>
    setForm((f) => ({ ...f, conditions: f.conditions.filter((_, idx) => idx !== i) }));

  const updateCondition = (i: number, partial: Partial<Condition>) =>
    setForm((f) => ({
      ...f,
      conditions: f.conditions.map((c, idx) => idx === i ? { ...c, ...partial } : c),
    }));

  const addAction = () =>
    setForm((f) => ({ ...f, actions: [...f.actions, { ...EMPTY_ACTION }] }));

  const removeAction = (i: number) =>
    setForm((f) => ({ ...f, actions: f.actions.filter((_, idx) => idx !== i) }));

  const updateAction = (i: number, partial: Partial<Action>) =>
    setForm((f) => ({
      ...f,
      actions: f.actions.map((a, idx) => idx === i ? { ...a, ...partial } : a),
    }));

  const getActionValueLabel = (action: Action) => {
    if (action.field === "categoryId") {
      return categories.find((c) => c.id === action.value)?.name ?? action.value;
    }
    if (action.field === "projectId") {
      return projects.find((p) => p.id === action.value)?.name ?? action.value;
    }
    return action.value;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Автоматизация</h1>
          <p className="text-sm text-gray-500 mt-0.5">Правила автоматической категоризации транзакций</p>
        </div>
        <Button className="bg-[#1A56DB] hover:bg-[#1A56DB]/90" size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Создать правило
        </Button>
      </div>

      {/* Rules list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : rules.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Zap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Нет правил автоматизации</p>
            <p className="text-sm text-gray-400 mt-1">
              Создайте правило, и транзакции будут категоризироваться автоматически
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id} className={cn("border-0 shadow-sm", !rule.isActive && "opacity-60")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void handleToggle(rule)}
                      className={cn(
                        "w-9 h-5 rounded-full transition-colors relative shrink-0",
                        rule.isActive ? "bg-[#0E9F6E]" : "bg-gray-300"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                        rule.isActive ? "left-4" : "left-0.5"
                      )} />
                    </button>
                    <span className="font-semibold text-sm">{rule.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Приоритет: {rule.priority}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(rule)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      className="h-7 w-7 text-[#E02424] hover:text-[#E02424] hover:bg-red-50"
                      onClick={() => void handleDelete(rule.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                  <div>
                    <span className="font-medium text-gray-500 uppercase text-[10px] tracking-wide">
                      Условия ({rule.conditionLogic}):
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {rule.conditions.map((c, i) => (
                        <div key={i} className="pl-2">
                          {FIELD_LABELS[c.field] ?? c.field}{" "}
                          <span className="text-gray-400">{OPERATOR_LABELS[c.operator] ?? c.operator}</span>{" "}
                          <span className="font-mono bg-gray-100 px-1 rounded">«{c.value}»</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500 uppercase text-[10px] tracking-wide">Действия:</span>
                    <div className="mt-1 space-y-0.5">
                      {rule.actions.map((a, i) => (
                        <div key={i} className="pl-2">
                          {ACTION_FIELD_LABELS[a.field] ?? a.field}{" → "}
                          <span className="font-medium">{getActionValueLabel(a)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rule builder dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать правило" : "Новое правило"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Name + Priority */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">Название</label>
                <Input
                  className="mt-1"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Например: Зарплата"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Приоритет</label>
                <Input
                  className="mt-1"
                  type="number"
                  min={0} max={100}
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Condition logic toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Совпадение условий:</span>
              <div className="flex gap-1 p-0.5 bg-gray-100 rounded">
                {["AND", "OR"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setForm((f) => ({ ...f, conditionLogic: v }))}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-medium transition-colors",
                      form.conditionLogic === v ? "bg-white shadow text-[#1A56DB]" : "text-gray-500"
                    )}
                  >
                    {v === "AND" ? "Все (AND)" : "Любое (OR)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Условия</label>
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={addCondition}>
                  <Plus className="w-3 h-3 mr-1" /> Добавить
                </Button>
              </div>
              <div className="space-y-2">
                {form.conditions.map((cond, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Select
                      value={cond.field}
                      onValueChange={(v) => updateCondition(i, { field: v })}
                    >
                      <SelectTrigger className="h-8 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FIELD_LABELS).map(([k, lbl]) => (
                          <SelectItem key={k} value={k} className="text-xs">{lbl}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={cond.operator}
                      onValueChange={(v) => updateCondition(i, { operator: v })}
                    >
                      <SelectTrigger className="h-8 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(OPERATOR_LABELS).map(([k, lbl]) => (
                          <SelectItem key={k} value={k} className="text-xs">{lbl}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      className="h-8 text-xs flex-1"
                      value={cond.value}
                      onChange={(e) => updateCondition(i, { value: e.target.value })}
                      placeholder="значение"
                    />

                    {form.conditions.length > 1 && (
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7 shrink-0"
                        onClick={() => removeCondition(i)}
                      >
                        <Trash2 className="w-3 h-3 text-gray-400" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Действия</label>
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={addAction}>
                  <Plus className="w-3 h-3 mr-1" /> Добавить
                </Button>
              </div>
              <div className="space-y-2">
                {form.actions.map((action, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Select
                      value={action.field}
                      onValueChange={(v) => updateAction(i, { field: v, value: "" })}
                    >
                      <SelectTrigger className="h-8 text-xs w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACTION_FIELD_LABELS).map(([k, lbl]) => (
                          <SelectItem key={k} value={k} className="text-xs">{lbl}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {action.field === "categoryId" ? (
                      <Select
                        value={action.value}
                        onValueChange={(v) => updateAction(i, { value: v })}
                      >
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="Категория" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : action.field === "projectId" ? (
                      <Select
                        value={action.value}
                        onValueChange={(v) => updateAction(i, { value: v })}
                      >
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="Проект" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((p) => (
                            <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="h-8 text-xs flex-1"
                        value={action.value}
                        onChange={(e) => updateAction(i, { value: e.target.value })}
                        placeholder="значение"
                      />
                    )}

                    {form.actions.length > 1 && (
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7 shrink-0"
                        onClick={() => removeAction(i)}
                      >
                        <Trash2 className="w-3 h-3 text-gray-400" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test results */}
          {testMatches !== null && (
            <div className="border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">
                  {testMatches.length === 0
                    ? "Нет совпадений среди последних 50 транзакций"
                    : `Совпадает ${testMatches.length} из последних 50 транзакций:`}
                </span>
                <button
                  onClick={() => setTestMatches(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              {testMatches.length > 0 && (
                <div className="divide-y max-h-48 overflow-y-auto">
                  {testMatches.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between px-3 py-2 text-xs">
                      <div className="min-w-0">
                        <p className="text-gray-700 truncate">{tx.description ?? "—"}</p>
                        <p className="text-gray-400">
                          {formatDate(new Date(tx.date))} · {tx.account.name}
                          {tx.category && <span className="ml-1 text-gray-400">· {tx.category.name}</span>}
                        </p>
                      </div>
                      <span className={`ml-3 font-semibold shrink-0 ${
                        tx.type === "INCOME" ? "text-[#0E9F6E]" : "text-[#E02424]"
                      }`}>
                        {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || form.conditions.every((c) => !c.value.trim())}
              className="mr-auto"
            >
              {testing
                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Проверяю…</>
                : <><PlayCircle className="w-3.5 h-3.5 mr-1.5" /> Протестировать</>
              }
            </Button>
            <Button variant="outline" onClick={() => setDialog(false)}>Отмена</Button>
            <Button
              className="bg-[#1A56DB] hover:bg-[#1A56DB]/90"
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
            >
              {saving ? "Сохранение…" : editing ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
