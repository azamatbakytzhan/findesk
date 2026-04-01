import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CategoriesSettingsPage() {
  const session = await auth();
  if (!session) return null;

  const categories = await prisma.category.findMany({
    where: { organizationId: session.user.organizationId, parentId: null },
    include: { children: true },
    orderBy: { name: "asc" },
  });

  const incomeCategories = categories.filter((c) => c.type === "INCOME");
  const expenseCategories = categories.filter((c) => c.type !== "INCOME");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Статьи и категории</h1>
        <p className="text-sm text-gray-500 mt-1">Управление статьями доходов и расходов</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#0E9F6E]">
              Статьи доходов ({incomeCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {incomeCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                >
                  <span className="text-sm font-medium">{cat.name}</span>
                  {cat.isSystem && (
                    <Badge variant="secondary" className="text-xs">Системная</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#FF8C00]">
              Статьи расходов ({expenseCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenseCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                >
                  <span className="text-sm font-medium">{cat.name}</span>
                  {cat.isSystem && (
                    <Badge variant="secondary" className="text-xs">Системная</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
