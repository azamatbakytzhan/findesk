import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

export default async function CalendarPage() {
  const session = await auth();
  if (!session) return null;

  const orgId = session.user.organizationId;

  const now = new Date();
  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const plannedTransactions = await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      isPlanned: true,
      date: { gte: now, lte: thirtyDaysLater },
    },
    include: { category: true, account: true },
    orderBy: { date: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Платёжный календарь</h1>
        <p className="text-sm text-gray-500 mt-1">Плановые поступления и платежи на ближайшие 30 дней</p>
      </div>

      {plannedTransactions.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Нет плановых операций</p>
            <p className="text-sm text-gray-400 mt-1">
              Добавьте плановые транзакции, чтобы видеть их здесь
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Ближайшие {plannedTransactions.length} операций
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plannedTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        tx.type === "INCOME" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {tx.description ?? tx.category?.name ?? "Без описания"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(tx.date)} · {tx.account.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        tx.type === "INCOME" ? "text-[#0E9F6E]" : "text-[#E02424]"
                      }`}
                    >
                      {tx.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(Number(tx.amount))}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-0.5">
                      Плановый
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
