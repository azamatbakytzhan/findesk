import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: number;
  change?: number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  valueColor?: string;
}

export function KpiCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  iconBg,
  valueColor,
}: KpiCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-500">{title}</span>
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg)}>
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
        </div>
        <div className={cn("text-2xl font-bold", valueColor ?? "text-gray-900")}>
          {formatCurrency(value)}
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : isNegative ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : (
              <Minus className="w-4 h-4 text-gray-400" />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-gray-400"
              )}
            >
              {isPositive ? "+" : ""}
              {change}% к прошлому месяцу
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
