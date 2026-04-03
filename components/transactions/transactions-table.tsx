"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineCategorySelect } from "@/components/transactions/inline-category-select";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

export interface TransactionRow {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  currency: string;
  date: Date | string;
  description: string | null;
  tags: string[];
  account: { id: string; name: string; currency: string };
  category: { id: string; name: string; color: string | null } | null;
  project: { id: string; name: string } | null;
  counterparty: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
}

interface Props {
  data: TransactionRow[];
  categories: Category[];
  isLoading?: boolean;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export function TransactionsTable({
  data,
  categories,
  isLoading,
  pagination,
  onPageChange,
  onRefresh,
}: Props) {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [localData, setLocalData] = useState<TransactionRow[]>(data);

  // Keep local data synced with prop
  if (data !== localData && !isLoading) {
    setLocalData(data);
  }

  const updateCategory = useCallback((txId: string, categoryId: string | null) => {
    setLocalData((prev) =>
      prev.map((tx) => {
        if (tx.id !== txId) return tx;
        if (!categoryId) return { ...tx, category: null };
        const cat = categories.find((c) => c.id === categoryId);
        return {
          ...tx,
          category: cat ? { id: cat.id, name: cat.name, color: null } : null,
        };
      })
    );
  }, [categories]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Удалить транзакцию?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
      toast.success("Транзакция удалена");
      setLocalData((prev) => prev.filter((t) => t.id !== id));
      onRefresh();
    } catch {
      toast.error("Не удалось удалить транзакцию");
    }
  }, [onRefresh]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Object.keys(rowSelection).filter((k) => rowSelection[k]);
    if (!ids.length) return;
    if (!confirm(`Удалить ${ids.length} транзакций?`)) return;

    await Promise.all(
      ids.map((id) => fetch(`/api/transactions/${id}`, { method: "DELETE" }))
    );
    toast.success(`Удалено ${ids.length} транзакций`);
    setRowSelection({});
    onRefresh();
  }, [rowSelection, onRefresh]);

  const columns: ColumnDef<TransactionRow>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      size: 40,
    },
    {
      accessorKey: "date",
      header: "Дата",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {formatDate(row.original.date)}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: "description",
      header: "Описание",
      cell: ({ row }) => {
        const tx = row.original;
        return (
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {tx.description ?? "—"}
            </p>
            {tx.counterparty && (
              <p className="text-xs text-gray-500 truncate">{tx.counterparty.name}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "account",
      header: "Счёт",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.account.name}</span>
      ),
      size: 120,
    },
    {
      accessorKey: "categoryId",
      header: "Категория",
      cell: ({ row }) => (
        <InlineCategorySelect
          transaction={{
            id: row.original.id,
            type: row.original.type,
            category: row.original.category,
          }}
          categories={categories}
          onUpdate={(catId) => updateCategory(row.original.id, catId)}
        />
      ),
      size: 140,
    },
    {
      accessorKey: "project",
      header: "Проект",
      cell: ({ row }) =>
        row.original.project ? (
          <Badge variant="outline" className="text-xs font-normal">
            {row.original.project.name}
          </Badge>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
      size: 120,
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Сумма</div>,
      cell: ({ row }) => {
        const tx = row.original;
        const isIncome = tx.type === "INCOME";
        const isTransfer = tx.type === "TRANSFER";
        return (
          <div
            className={cn(
              "text-right font-mono font-semibold text-sm whitespace-nowrap",
              isIncome
                ? "text-[#0E9F6E]"
                : isTransfer
                ? "text-blue-600"
                : "text-[#E02424]"
            )}
          >
            {isIncome ? "+" : isTransfer ? "" : "−"}
            {formatCurrency(tx.amount, tx.currency)}
          </div>
        );
      },
      size: 130,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleDelete(row.original.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
      size: 40,
    },
  ];

  const table = useReactTable({
    data: localData,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-blue-700">
            Выбрано: {selectedCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7"
            onClick={handleBulkDelete}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Удалить
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b bg-gray-50">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap"
                    style={{ width: header.column.getSize() }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-gray-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <ArrowUpDown className="w-8 h-8 text-gray-300" />
                    <p className="text-sm">Транзакции не найдены</p>
                    <p className="text-xs">Попробуйте изменить фильтры</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b last:border-0 group hover:bg-gray-50/70 transition-colors",
                    row.getIsSelected() && "bg-blue-50/50"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-gray-500">
            Показано {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Назад
            </Button>
            <span className="text-sm font-medium">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Далее
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
