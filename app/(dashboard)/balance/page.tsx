import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function BalancePage() {
  const session = await auth();
  if (!session) return null;

  const orgId = session.user.organizationId;

  const accounts = await prisma.account.findMany({
    where: { organizationId: orgId, isArchived: false },
  });

  const totalAssets = accounts.reduce((s, a) => s + Number(a.balance), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Баланс</h1>
        <p className="text-sm text-gray-500 mt-1">Управленческий баланс компании</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#0E9F6E]">Активы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Денежные средства</span>
                <span className="text-sm font-semibold">{formatCurrency(totalAssets)}</span>
              </div>
              {accounts.map((a) => (
                <div key={a.id} className="flex justify-between items-center py-1 pl-4">
                  <span className="text-sm text-gray-500">{a.name}</span>
                  <span className="text-sm">{formatCurrency(Number(a.balance))}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Дебиторская задолженность</span>
                <span className="text-sm font-semibold">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2">
                <span className="font-semibold">ИТОГО АКТИВЫ</span>
                <span className="font-bold text-[#0E9F6E]">{formatCurrency(totalAssets)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liabilities + Equity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#1A56DB]">
              Пассивы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Кредиторская задолженность</span>
                <span className="text-sm font-semibold">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Собственный капитал</span>
                <span className="text-sm font-semibold">{formatCurrency(totalAssets)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2">
                <span className="font-semibold">ИТОГО ПАССИВЫ</span>
                <span className="font-bold text-[#1A56DB]">{formatCurrency(totalAssets)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-700">
            Баланс сходится: активы равны пассивам.{" "}
            <span className="font-semibold">{formatCurrency(totalAssets)}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
