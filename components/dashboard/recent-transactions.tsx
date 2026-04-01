import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string | null;
  date: Date;
  category: { name: string } | null;
  account: { name: string };
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Последние транзакции</CardTitle>
        <Link
          href="/transactions"
          className="text-sm text-[#1A56DB] hover:underline flex items-center gap-1"
        >
          Все <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Транзакций пока нет</p>
            <Link href="/transactions" className="text-sm text-[#1A56DB] hover:underline mt-1 inline-block">
              Добавить транзакцию
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                    tx.type === "INCOME"
                      ? "bg-green-100 text-green-700"
                      : tx.type === "EXPENSE"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  )}
                >
                  {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : "↔"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {tx.description ?? tx.category?.name ?? "Без описания"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tx.account.name} · {formatDate(tx.date)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
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
                  </p>
                  {tx.category && (
                    <Badge variant="secondary" className="text-xs mt-0.5">
                      {tx.category.name}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
