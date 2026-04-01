"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.string().min(1, "Введите сумму"),
  date: z.string().min(1, "Выберите дату"),
  accountId: z.string().min(1, "Выберите счёт"),
  categoryId: z.string().optional(),
  projectId: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  isPlanned: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
}

interface Project {
  id: string;
  name: string;
}

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  categories: Category[];
  projects: Project[];
  onSuccess: () => void;
}

export function TransactionForm({
  open,
  onOpenChange,
  accounts,
  categories,
  projects,
  onSuccess,
}: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "EXPENSE",
      date: new Date().toISOString().split("T")[0],
      accountId: accounts[0]?.id ?? "",
      isPlanned: false,
    },
  });

  const watchType = watch("type");

  const filteredCategories = categories.filter((c) =>
    watchType === "INCOME" ? c.type === "INCOME" : c.type !== "INCOME"
  );

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const tags = data.tags
        ? data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount.replace(/\s/g, "").replace(",", ".")),
          date: new Date(data.date).toISOString(),
          categoryId: data.categoryId || undefined,
          projectId: data.projectId || undefined,
          tags,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Ошибка сохранения");
      }

      toast({ title: "Транзакция добавлена" });
      reset({
        type: "EXPENSE",
        date: new Date().toISOString().split("T")[0],
        accountId: accounts[0]?.id ?? "",
        isPlanned: false,
        amount: "",
        categoryId: "",
        projectId: "",
        description: "",
        tags: "",
      });
      onOpenChange(false);
      onSuccess();
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Новая транзакция</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          {/* Type toggle */}
          <div>
            <Label className="text-sm font-medium">Тип операции</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(["INCOME", "EXPENSE", "TRANSFER"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setValue("type", t);
                    setValue("categoryId", "");
                  }}
                  className={cn(
                    "py-2 rounded-lg text-sm font-medium border transition-colors",
                    watchType === t
                      ? t === "INCOME"
                        ? "bg-green-50 border-green-400 text-green-700"
                        : t === "EXPENSE"
                        ? "bg-red-50 border-red-400 text-red-700"
                        : "bg-blue-50 border-blue-400 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {t === "INCOME" ? "Доход" : t === "EXPENSE" ? "Расход" : "Перевод"}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Сумма *</Label>
            <Input
              id="amount"
              placeholder="0"
              {...register("amount")}
              inputMode="decimal"
            />
            {errors.amount && (
              <p className="text-xs text-red-500">{errors.amount.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Дата *</Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && (
              <p className="text-xs text-red-500">{errors.date.message}</p>
            )}
          </div>

          {/* Account */}
          <div className="space-y-1.5">
            <Label>Счёт *</Label>
            <Select
              value={watch("accountId")}
              onValueChange={(v) => setValue("accountId", v)}
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
            {errors.accountId && (
              <p className="text-xs text-red-500">{errors.accountId.message}</p>
            )}
          </div>

          {/* Category */}
          {watchType !== "TRANSFER" && (
            <div className="space-y-1.5">
              <Label>Статья / Категория</Label>
              <Select
                value={watch("categoryId") ?? ""}
                onValueChange={(v) => setValue("categoryId", v)}
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
          )}

          {/* Project */}
          {projects.length > 0 && (
            <div className="space-y-1.5">
              <Label>Проект</Label>
              <Select
                value={watch("projectId") ?? ""}
                onValueChange={(v) => setValue("projectId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Без проекта" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Без проекта</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Описание</Label>
            <Input
              id="description"
              placeholder="Краткое описание операции"
              {...register("description")}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags">Теги (через запятую)</Label>
            <Input
              id="tags"
              placeholder="зарплата, офис, реклама"
              {...register("tags")}
            />
          </div>

          {/* Planned */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPlanned"
              className="h-4 w-4 rounded border-gray-300"
              {...register("isPlanned")}
            />
            <Label htmlFor="isPlanned" className="font-normal cursor-pointer">
              Плановая операция (не влияет на баланс)
            </Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#1A56DB] hover:bg-[#1A56DB]/90"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
