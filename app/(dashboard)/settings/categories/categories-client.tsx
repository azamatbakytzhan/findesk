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
import { Plus, Trash2, Lock, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
  isSystem: boolean;
  parentId: string | null;
}

interface Props {
  initialCategories: Category[];
}

export function CategoriesClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetType, setSheetType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const incomeCategories = categories.filter((c) => c.type === "INCOME" && c.parentId === null);
  const expenseCategories = categories.filter((c) => c.type !== "INCOME" && c.parentId === null);

  const openSheet = (type: "INCOME" | "EXPENSE") => {
    setSheetType(type);
    setName("");
    setSheetOpen(true);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Введите название категории");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type: sheetType }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Ошибка при создании");
        return;
      }
      setCategories((prev) => [...prev, json]);
      setSheetOpen(false);
      toast.success("Категория добавлена");
    } catch {
      toast.error("Ошибка сервера");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Удалить категорию «${cat.name}»?`)) return;
    setDeletingId(cat.id);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Ошибка при удалении");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      toast.success("Категория удалена");
    } catch {
      toast.error("Ошибка сервера");
    } finally {
      setDeletingId(null);
    }
  };

  const renderList = (list: Category[]) =>
    list.length === 0 ? (
      <p className="text-sm text-gray-400 text-center py-4">Нет категорий</p>
    ) : (
      <div className="space-y-1">
        {list.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
          >
            <span className="text-sm font-medium">{cat.name}</span>
            <div className="flex items-center gap-1.5">
              {cat.isSystem ? (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Lock className="w-3 h-3" />
                  Системная
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                  disabled={deletingId === cat.id}
                  onClick={() => handleDelete(cat)}
                >
                  {deletingId === cat.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Статьи и категории</h1>
        <p className="text-sm text-gray-500 mt-1">Управление статьями доходов и расходов</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-[#0E9F6E]">
                Статьи доходов ({incomeCategories.length})
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-[#0E9F6E] hover:bg-green-50"
                onClick={() => openSheet("INCOME")}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderList(incomeCategories)}</CardContent>
        </Card>

        {/* Expense */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-[#FF8C00]">
                Статьи расходов ({expenseCategories.length})
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-[#FF8C00] hover:bg-orange-50"
                onClick={() => openSheet("EXPENSE")}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderList(expenseCategories)}</CardContent>
        </Card>
      </div>

      {/* Add sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {sheetType === "INCOME" ? "Новая статья дохода" : "Новая статья расхода"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            <div>
              <Label htmlFor="cat-name" className="text-sm">
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cat-name"
                className="mt-1.5"
                placeholder={sheetType === "INCOME" ? "Например: Продажи" : "Например: Аренда"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div>
              <Label className="text-sm">Тип</Label>
              <div className="mt-1.5">
                <Badge
                  variant="secondary"
                  className={
                    sheetType === "INCOME"
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }
                >
                  {sheetType === "INCOME" ? "Доход" : "Расход"}
                </Badge>
              </div>
            </div>
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
                onClick={handleCreate}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Добавить"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
