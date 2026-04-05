export const dynamic = "force-dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

const integrations = [
  { name: "Kaspi Bank", status: "soon", description: "Автоматический импорт выписок" },
  { name: "Halyk Bank", status: "soon", description: "Синхронизация транзакций" },
  { name: "1C Бухгалтерия", status: "soon", description: "Экспорт данных" },
  { name: "Excel / CSV", status: "available", description: "Импорт банковских выписок" },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Интеграции</h1>
        <p className="text-sm text-gray-500 mt-1">Подключение внешних сервисов и банков</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {integrations.map((item) => (
          <Card key={item.name} className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              </div>
              <Badge
                variant={item.status === "available" ? "success" : "secondary"}
                className="text-xs"
              >
                {item.status === "available" ? "Доступно" : "Скоро"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
