import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { FolderOpen } from "lucide-react";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session) return null;

  const projects = await prisma.project.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      _count: { select: { transactions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusLabels: Record<string, string> = {
    ACTIVE: "Активный",
    COMPLETED: "Завершён",
    ARCHIVED: "Архив",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Проекты</h1>
        <p className="text-sm text-gray-500 mt-1">Учёт финансов по проектам</p>
      </div>

      {projects.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Нет проектов</p>
            <p className="text-sm text-gray-400 mt-1">Создайте проект для детального учёта</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${project.color ?? "#1A56DB"}20` }}
                  >
                    <FolderOpen
                      className="w-5 h-5"
                      style={{ color: project.color ?? "#1A56DB" }}
                    />
                  </div>
                  <Badge
                    variant={
                      project.status === "ACTIVE"
                        ? "success"
                        : project.status === "COMPLETED"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs"
                  >
                    {statusLabels[project.status] ?? project.status}
                  </Badge>
                </div>
                <p className="text-base font-semibold text-gray-900">{project.name}</p>
                {project.budget && (
                  <p className="text-sm text-gray-500 mt-1">
                    Бюджет: {formatCurrency(Number(project.budget))}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {project._count.transactions} транзакций
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
