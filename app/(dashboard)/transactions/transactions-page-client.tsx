"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionsTable, type TransactionRow } from "@/components/transactions/transactions-table";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { CsvImportDialog } from "@/components/transactions/csv-import-dialog";
import { Plus, Search, Filter, Upload, X } from "lucide-react";

interface Account { id: string; name: string; balance: number }
interface Category { id: string; name: string; type: string; parentId: string | null }
interface Project { id: string; name: string }

interface Props {
  accounts: Account[];
  categories: Category[];
  projects: Project[];
}

interface Filters {
  search: string;
  type: string;
  accountId: string;
  categoryId: string;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  type: "",
  accountId: "",
  categoryId: "",
  dateFrom: "",
  dateTo: "",
};

export function TransactionsPageClient({ accounts, categories, projects }: Props) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TransactionRow[]>([]);
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total: 0, totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const fetchTransactions = useCallback(async (f: Filters, p: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (f.search)     params.set("search",     f.search);
      if (f.type)       params.set("type",        f.type);
      if (f.accountId)  params.set("accountId",   f.accountId);
      if (f.categoryId) params.set("categoryId",  f.categoryId);
      if (f.dateFrom)   params.set("dateFrom",    f.dateFrom);
      if (f.dateTo)     params.set("dateTo",      f.dateTo);

      const res = await fetch(`/api/transactions?${params}`);
      const json = await res.json();
      setData(json.transactions ?? []);
      setPagination(json.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTransactions(filters, page);
  }, [filters, page, fetchTransactions]);

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const handleSuccess = () => void fetchTransactions(filters, page);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Транзакции</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination.total > 0
              ? `${pagination.total} операций`
              : "Все операции по счетам"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Импорт CSV
          </Button>
          <Button
            className="bg-[#1A56DB] hover:bg-[#1A56DB]/90"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Добавить
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Поиск по описанию или контрагенту..."
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type */}
            <Select value={filters.type || "ALL"} onValueChange={(v) => setFilter("type", v === "ALL" ? "" : v)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Все типы</SelectItem>
                <SelectItem value="INCOME">Доходы</SelectItem>
                <SelectItem value="EXPENSE">Расходы</SelectItem>
                <SelectItem value="TRANSFER">Переводы</SelectItem>
              </SelectContent>
            </Select>

            {/* Account */}
            <Select value={filters.accountId || "ALL"} onValueChange={(v) => setFilter("accountId", v === "ALL" ? "" : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Все счета" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Все счета</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range row */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">С:</span>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilter("dateFrom", e.target.value)}
                className="w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">По:</span>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilter("dateTo", e.target.value)}
                className="w-36"
              />
            </div>

            {/* Category filter */}
            <Select value={filters.categoryId || "ALL"} onValueChange={(v) => setFilter("categoryId", v === "ALL" ? "" : v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Все категории</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">
                <X className="w-3.5 h-3.5 mr-1" />
                Сбросить
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <TransactionsTable
            data={data}
            categories={categories}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
            onRefresh={handleSuccess}
          />
        </CardContent>
      </Card>

      {/* Add transaction sheet */}
      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        accounts={accounts}
        categories={categories}
        projects={projects}
        onSuccess={handleSuccess}
      />

      {/* CSV import dialog */}
      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        accounts={accounts}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
