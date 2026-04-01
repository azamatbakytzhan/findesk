import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const roleLabels: Record<string, string> = {
  OWNER: "Владелец",
  ADMIN: "Администратор",
  ACCOUNTANT: "Бухгалтер",
  MANAGER: "Менеджер",
  VIEWER: "Наблюдатель",
};

export default async function TeamSettingsPage() {
  const session = await auth();
  if (!session) return null;

  const users = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Команда</h1>
        <p className="text-sm text-gray-500 mt-1">Управление пользователями и доступами</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Пользователи ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => {
              const initials = user.name
                ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                : user.email.slice(0, 2).toUpperCase();
              return (
                <div key={user.id} className="flex items-center gap-3 py-2">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-[#1A56DB] text-white text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name ?? "Без имени"}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {roleLabels[user.role] ?? user.role}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
