import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard } from "lucide-react";

export default async function DebtsPage() {
  const session = await auth();
  if (!session) return null;

  const paymentRequests = await prisma.paymentRequest.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const statusLabels: Record<string, string> = {
    PENDING: "Ожидает",
    APPROVED: "Одобрен",
    REJECTED: "Отклонён",
    PAID: "Оплачен",
  };

  const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "destructive",
    PAID: "secondary",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Обязательства</h1>
        <p className="text-sm text-gray-500 mt-1">Заявки на оплату и контроль обязательств</p>
      </div>

      {paymentRequests.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Нет обязательств</p>
            <p className="text-sm text-gray-400 mt-1">Здесь будут отображаться заявки на оплату</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paymentRequests.map((pr) => (
            <Card key={pr.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{pr.description}</p>
                  {pr.dueDate && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Срок: {formatDate(pr.dueDate)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusColors[pr.status] ?? "secondary"}>
                    {statusLabels[pr.status] ?? pr.status}
                  </Badge>
                  <span className="text-sm font-bold text-[#E02424]">
                    -{formatCurrency(Number(pr.amount))}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
