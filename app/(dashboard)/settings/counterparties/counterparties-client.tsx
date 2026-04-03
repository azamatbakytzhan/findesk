"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";

type CounterpartyType = "CLIENT" | "SUPPLIER" | "EMPLOYEE" | "OTHER";

interface Counterparty {
  id: string;
  name: string;
  type: CounterpartyType;
  bin: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
}

interface Props {
  initialCounterparties: Counterparty[];
}

const TYPE_LABELS: Record<CounterpartyType, string> = {
  CLIENT:   "Клиент",
  SUPPLIER: "Поставщик",
  EMPLOYEE: "Сотрудник",
  OTHER:    "Прочее",
};

const TYPE_COLORS: Record<CounterpartyType, string> = {
  CLIENT:   "bg-blue-100 text-blue-700",
  SUPPLIER: "bg-orange-100 text-orange-700",
  EMPLOYEE: "bg-purple-100 text-purple-700",
  OTHER:    "bg-gray-100 text-gray-600",
};

const EMPTY_FORM = {
  name:  "",
  type:  "CLIENT" as CounterpartyType,
  bin:   "",
  phone: "",
  email: "",
};

export function CounterpartiesClient({ initialCounterparties }: Props) {
  const [counterparties, setCounterparties] = useState<Counterparty[]>(initialCounterparties);
  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [editId,      setEditId]      = useState<string | null>(null);
  const [form,        setForm]        = useState({ ...EMPTY_FORM });
  const [saving,      setSaving]      = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState<CounterpartyType | "ALL">("ALL");

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setSheetOpen(true);
  };

  const openEdit = (cp: Counterparty) => {
    setEditId(cp.id);
    setForm({
      name:  cp.name,
      type:  cp.type,
      bin:   cp.bin   ?? "",
      phone: cp.phone ?? "",
      email: cp.email ?? "",
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Введите название");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name:  form.name.trim(),
        type:  form.type,
        bin:   form.bin.trim()   || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
      };

      if (editId) {
        const res  = await fetch(`/api/counterparties/${editId}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) { toast.error(json.error ?? "Ошибка при сохранении"); return; }
        setCounterparties((prev) =>
          prev.map((c) => (c.id === editId ? { ...c, ...json } : c))
        );
        toast.success("Контрагент обновлён");
      } else {
        const res  = await fetch("/api/counterparties", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) { toast.error(json.error ?? "Ошибка при создании"); return; }
        setCounterparties((prev) => [...prev, json]);
        toast.success("Контрагент добавлен");
      }
      setSheetOpen(false);
    } catch {
      toast.error("Ошибка сервера");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cp: Counterparty) => {
    if (!window.confirm(`Удалить контрагента «${cp.name}»?`)) return;
    setDeletingId(cp.id);
    try {
      const res  = await fetch(`/api/counterparties/${cp.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Ошибка при удалении"); return; }
      setCounterparties((prev) => prev.filter((c) => c.id !== cp.id));
      toast.success("Контрагент удалён");
    } catch {
      toast.error("Ошибка сервера");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = counterparties.filter((cp) => {
    const matchSearch =
      !search ||
      cp.name.toLowerCase().includes(search.toLowerCase()) ||
      (cp.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (cp.phone ?? "").includes(search) ||
      (cp.bin   ?? "").includes(search);
    const matchType = typeFilter === "ALL" || cp.type === typeFilter;
    return matchSearch && matchType;
  });

  const grouped = (["CLIENT", "SUPPLIER", "EMPLOYEE", "OTHER"] as CounterpartyType[]).map(
    (type) => ({
      type,
      items: filtered.filter((cp) => cp.type === type),
    })
  ).filter((g) => g.items.length > 0 || typeFilter === "ALL");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Контрагенты</h1>
          <p className="text-sm text-gray-500 mt-1">Управление клиентами, поставщиками и сотрудниками</p>
        </div>
        <Button
          className="bg-[#1A56DB] hover:bg-[#1A56DB]/90"
          onClick={openCreate}
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Поиск по имени, email, телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as CounterpartyType | "ALL")}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Все типы</SelectItem>
            {(["CLIENT", "SUPPLIER", "EMPLOYEE", "OTHER"] as CounterpartyType[]).map((t) => (
              <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["CLIENT", "SUPPLIER", "EMPLOYEE", "OTHER"] as CounterpartyType[]).map((type) => {
          const count = counterparties.filter((c) => c.type === type).length;
          return (
            <Card key={type} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">{TYPE_LABELS[type]}ы</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lists */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center text-sm text-gray-400">
            {counterparties.length === 0
              ? "Нет контрагентов. Нажмите «Добавить», чтобы создать первого."
              : "Ничего не найдено по заданным фильтрам."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {grouped.map(({ type, items }) =>
            items.length === 0 ? null : (
              <Card key={type} className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-800">
                      {TYPE_LABELS[type]}ы ({items.length})
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-[#1A56DB] hover:bg-blue-50"
                      onClick={() => { setForm({ ...EMPTY_FORM, type }); setEditId(null); setSheetOpen(true); }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {items.map((cp) => (
                      <div
                        key={cp.id}
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 group"
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{cp.name}</span>
                            <Badge
                              variant="secondary"
                              className={`text-xs shrink-0 ${TYPE_COLORS[cp.type]}`}
                            >
                              {TYPE_LABELS[cp.type]}
                            </Badge>
                          </div>
                          {(cp.email || cp.phone || cp.bin) && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {[cp.phone, cp.email, cp.bin ? `БИН: ${cp.bin}` : null]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-gray-400 hover:text-[#1A56DB]"
                            onClick={() => openEdit(cp)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                            disabled={deletingId === cp.id}
                            onClick={() => handleDelete(cp)}
                          >
                            {deletingId === cp.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editId ? "Редактировать контрагента" : "Новый контрагент"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            {/* Name */}
            <div>
              <Label htmlFor="cp-name" className="text-sm">
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cp-name"
                className="mt-1.5"
                placeholder="Название компании или ФИО"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* Type */}
            <div>
              <Label className="text-sm">
                Тип <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as CounterpartyType }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["CLIENT", "SUPPLIER", "EMPLOYEE", "OTHER"] as CounterpartyType[]).map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* BIN */}
            <div>
              <Label htmlFor="cp-bin" className="text-sm">БИН / ИИН</Label>
              <Input
                id="cp-bin"
                className="mt-1.5"
                placeholder="123456789012"
                value={form.bin}
                onChange={(e) => setForm((f) => ({ ...f, bin: e.target.value }))}
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="cp-phone" className="text-sm">Телефон</Label>
              <Input
                id="cp-phone"
                className="mt-1.5"
                placeholder="+7 700 000 00 00"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="cp-email" className="text-sm">Email</Label>
              <Input
                id="cp-email"
                type="email"
                className="mt-1.5"
                placeholder="info@company.kz"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSheetOpen(false)}
              >
                Отмена
              </Button>
              <Button
                className="flex-1 bg-[#1A56DB] hover:bg-[#1A56DB]/90"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editId ? (
                  "Сохранить"
                ) : (
                  "Добавить"
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
