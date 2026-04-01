import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, getCurrentMonthRange } from "@/lib/utils";
import { Target } from "lucide-react";

export default async function BudgetsPage() {
  const session = await auth();
  if (!session) return null;

  const orgId = session.user.organizationId;
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { start, end } = getCurrentMonthRange();

  const [budgets, currentTx] = await Promise.all([
    prisma.budget.findMany({
      where: { organizationId: orgId, period },
      include: { category: true, project: true },
    }),
    prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        date: { gte: start, lte: end },
        type: "EXPENSE",
        isConfirmed: true,
      },
    }),
  ]);

  const budgetsWithActual = budgets.map((b) => {
    const actual = currentTx
      .filter((t) => t.categoryId === b.categoryId || t.projectId === b.projectId)
      .reduce((s, t) => s + Number(t.amount), 0);
    const planned = Number(b.plannedAmount);
    const pct = planned > 0 ? Math.round((actual / planned) * 100) : 0;
    return { ...b, actual, planned, pct };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Бюджеты</h1>
        <p className="text-sm text-gray-500 mt-1">Контроль плановых и фактических расходов</p>
      </div>

      {budgetsWithActual.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Бюджеты не настроены</p>
            <p className="text-sm text-gray-400 mt-1">
              Настройте бюджеты в разделе Настройки → Категории
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {budgetsWithActual.map((b) => (
            <Card key={b.id} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {b.category?.name ?? b.project?.name ?? "Без категории"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Фактически: {formatCurrency(b.actual)} / план: {formatCurrency(b.planned)}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      b.pct > 100 ? "text-[#E02424]" : b.pct > 80 ? "text-[#FF8C00]" : "text-[#0E9F6E]"
                    }`}
                  >
                    {b.pct}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      b.pct > 100
                        ? "bg-[#E02424]"
                        : b.pct > 80
                        ? "bg-[#FF8C00]"
                        : "bg-[#0E9F6E]"
                    }`}
                    style={{ width: `${Math.min(b.pct, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
