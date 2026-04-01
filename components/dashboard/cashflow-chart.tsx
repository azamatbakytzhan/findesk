"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, getMonthShort } from "@/lib/utils";

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface CashflowChartProps {
  data: MonthlyData[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="text-sm" style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
        {payload.length === 2 && payload[0] && payload[1] && (
          <p
            className={`text-sm font-semibold mt-1 pt-1 border-t border-gray-100 ${
              payload[0].value - payload[1].value >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            Поток: {formatCurrency(payload[0].value - payload[1].value)}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function CashflowChart({ data }: CashflowChartProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">
          Денежный поток за 6 месяцев
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, left: 10, bottom: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6B7280" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
              formatter={(value) =>
                value === "income" ? "Доходы" : "Расходы"
              }
            />
            <Bar dataKey="income" name="income" fill="#0E9F6E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="expense" fill="#FF8C00" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function generateMockCashflowData(): MonthlyData[] {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: getMonthShort(d.getMonth()),
      income: Math.floor(Math.random() * 3000000) + 2000000,
      expense: Math.floor(Math.random() * 2000000) + 1000000,
    });
  }
  return months;
}
