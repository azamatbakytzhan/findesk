"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";
import { Plus, Wallet, Banknote, CreditCard, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Account {
  id: string;
  name: string;
  type: "BANK" | "CASH" | "CARD" | "EWALLET";
  currency: string;
  balance: number;
  color: string | null;
  isArchived: boolean;
  transactionCount: number;
}

const accountTypeLabels: Record<string, string> = {
  BANK: "Расчётный счёт",
  CASH: "Наличные",
  CARD: "Карта",
  EWALLET: "Электронный кошелёк",
};

const accountTypeIcons = {
  BANK: Wallet,
  CASH: Banknote,
  CARD: CreditCard,
  EWALLET: Smartphone,
};

const accountColors = [
  "#1A56DB", "#0E9F6E", "#FF8C00", "#E02424", "#7C3AED", "#DB2777", "#0891B2",
];

export function AccountsClient({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "BANK" as "BANK" | "CASH" | "CARD" | "EWALLET",
    currency: "KZT",
    balance: "0",
    color: "#1A56DB",
  });

  const totalBalance = accounts
    .filter((a) => !a.isArchived)
    .reduce((sum, a) => sum + a.balance, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, balance: parseFloat(form.balance) }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Ошибка");
      }

      toast.success("Счёт создан");
      setDialogOpen(false);
      setForm({ name: "", type: "BANK", currency: "KZT", balance: "0", color: "#1A56DB" });
      router.refresh();
    } catch (error) {
      toast.error(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Счета</h1>
          <p className="text-sm text-gray-500 mt-1">
            Управление банковскими счетами и кошельками
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1A56DB] hover:bg-[#1A56DB]/90">
              <Plus className="w-4 h-4 mr-2" />
              Добавить счёт
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый счёт</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Название *</Label>
                <Input
                  placeholder="Основной счёт"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Тип счёта *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as typeof form.type })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK">Расчётный счёт</SelectItem>
                    <SelectItem value="CASH">Наличные</SelectItem>
                    <SelectItem value="CARD">Карта</SelectItem>
                    <SelectItem value="EWALLET">Электронный кошелёк</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Начальный баланс</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Цвет</Label>
                <div className="flex gap-2">
                  {accountColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        form.color === color ? "border-gray-900 scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#1A56DB] hover:bg-[#1A56DB]/90"
                  disabled={isSubmitting}
                >
                  Создать
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Balance */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-[#1A56DB] to-blue-700 text-white">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-blue-100">Общий баланс</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
          <p className="text-sm text-blue-200 mt-1">
            {accounts.filter((a) => !a.isArchived).length} активных счёта
          </p>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => {
          const Icon = accountTypeIcons[account.type] ?? Wallet;
          return (
            <Card
              key={account.id}
              className={cn("border-0 shadow-sm", account.isArchived && "opacity-50")}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: account.color
                        ? `${account.color}20`
                        : "#1A56DB20",
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: account.color ?? "#1A56DB" }}
                    />
                  </div>
                  {account.isArchived && (
                    <Badge variant="secondary" className="text-xs">
                      Архив
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">{accountTypeLabels[account.type]}</p>
                <p className="text-base font-semibold text-gray-900 mt-0.5">
                  {account.name}
                </p>
                <p className="text-2xl font-bold mt-3" style={{ color: account.color ?? "#1A56DB" }}>
                  {formatCurrency(account.balance)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {account.transactionCount} операций
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
