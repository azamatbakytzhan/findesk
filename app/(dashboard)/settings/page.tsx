export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, Tag, Wallet, Zap, ArrowRight, CreditCard, Bell, Building2 } from "lucide-react";

const settingsItems = [
  {
    title: "Счета",
    description: "Управление банковскими счетами и кошельками",
    href: "/settings/accounts",
    icon: Wallet,
  },
  {
    title: "Статьи и категории",
    description: "Настройка статей доходов и расходов",
    href: "/settings/categories",
    icon: Tag,
  },
  {
    title: "Контрагенты",
    description: "Клиенты, поставщики и сотрудники",
    href: "/settings/counterparties",
    icon: Building2,
  },
  {
    title: "Команда",
    description: "Управление пользователями и доступами",
    href: "/settings/team",
    icon: Users,
  },
  {
    title: "Интеграции",
    description: "Подключение банков и внешних сервисов",
    href: "/settings/integrations",
    icon: Zap,
  },
  {
    title: "Автоматизация",
    description: "Правила автоматической категоризации транзакций",
    href: "/settings/automation",
    icon: Zap,
  },
  {
    title: "Тариф и оплата",
    description: "Управление подпиской и история платежей",
    href: "/settings/billing",
    icon: CreditCard,
  },
  {
    title: "Уведомления",
    description: "Email и Telegram уведомления",
    href: "/settings/notifications",
    icon: Bell,
  },
];

export default async function SettingsPage() {
  const session = await auth();
  if (!session) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
        <p className="text-sm text-gray-500 mt-1">
          Управление компанией {session.user.orgName}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-[#1A56DB]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Organization Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Информация о компании</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-sm text-gray-500">Название</span>
            <span className="text-sm font-medium">{session.user.orgName}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-sm text-gray-500">Ваша роль</span>
            <span className="text-sm font-medium">{session.user.role}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-500">Валюта</span>
            <span className="text-sm font-medium">KZT (тенге)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
