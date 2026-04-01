"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Search, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string | null;
  date: Date;
  category: { id: string; name: string } | null;
  account: { id: string; name: string };
  project: { id: string; name: string } | null;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface TransactionsClientProps {
  initialTransactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}

export function TransactionsClient({
  initialTransactions,
  accounts,
  categories,
}: TransactionsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    accountId: accounts[0]?.id ?? "",
    categoryId: "",
    description: "",
  });

  const filtered = initialTransactions.filter((tx) => {
    const matchSearch =
      !search ||
      tx.description?.toLowerCase().includes(search.toLowerCase()) ||
      tx.category?.name.toLowerCase().includes(search.toLowerCase()) ||
      tx.account.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || tx.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.accountId) {
      toast({ variant: "destructive", title: "Заполните обязательные поля" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Ошибка");
      }

      toast({ title: "Транзакция добавлена" });
      setSheetOpen(false);
      setForm({
        type: "EXPENSE",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        accountId: accounts[0]?.id ?? "",
        categoryId: "",
        description: "",
      });
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Что-то пошло не так",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      form.type === "INCOME" ? c.type === "INCOME" : c.type !== "INCOME"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Транзакции</h1>
          <p className="text-sm text-gray-500 mt-1">
            Все операции по вашим счетам
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="bg-[#1A56DB] hover:bg-[#1A56DB]/90">
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Новая транзакция</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "INCOME", categoryId: "" })}
                  className={cn(
                    "py-2 rounded-lg text-sm font-medium border transition-colors",
                    form.type === "INCOME"
                      ? "bg-green-50 border-green-300 text-green-700"
                      : "border-gray-200 text-gray-600"
                  )}
                >
                  Доход
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "EXPENSE", categoryId: "" })}
                  className={cn(
                    "py-2 rounded-lg text-sm font-medium border transition-colors",
                    form.type === "EXPENSE"
                      ? "bg-red-50 border-red-300 text-red-700"
                      : "border-gray-200 text-gray-600"
                  )}
                >
                  Расход
                </button>
              </div>

              <div className="space-y-1.5">
                <Label>Сумма *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Дата *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Счёт *</Label>
                <Select
                  value={form.accountId}
                  onValueChange={(v) => setForm({ ...form, accountId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите счёт" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Статья</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статью" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Описание</Label>
                <Input
                  placeholder="Краткое описание операции"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSheetOpen(false)}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#1A56DB] hover:bg-[#1A56DB]/90"
                  disabled={isSubmitting}
                >
                  Сохранить
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Поиск по описанию, категории..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Все типы</SelectItem>
                  <SelectItem value="INCOME">Доходы</SelectItem>
                  <SelectItem value="EXPENSE">Расходы</SelectItem>
                  <SelectItem value="TRANSFER">Переводы</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-gray-500">
              {filtered.length} транзакций
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Дата</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead>Счёт</TableHead>
              <TableHead>Статья</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                  Транзакций не найдено
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-gray-50/50">
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-900">
                      {tx.description ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {tx.account.name}
                  </TableCell>
                  <TableCell>
                    {tx.category ? (
                      <Badge variant="secondary" className="text-xs">
                        {tx.category.name}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        tx.type === "INCOME"
                          ? "text-[#0E9F6E]"
                          : tx.type === "EXPENSE"
                          ? "text-[#E02424]"
                          : "text-gray-700"
                      )}
                    >
                      {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : ""}
                      {formatCurrency(tx.amount)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
