"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

interface ExpenseChartProps {
  data: ExpenseCategory[];
}

const COLORS = ["#1A56DB", "#0E9F6E", "#FF8C00", "#E02424", "#7C3AED", "#DB2777"];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: ExpenseCategory }>;
}) => {
  if (active && payload && payload.length && payload[0]) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">{payload[0].payload.name}</p>
        <p className="text-sm text-gray-600">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export function ExpenseChart({ data }: ExpenseChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">
          Топ статей расходов
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-600 truncate">{item.name}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-medium">
                    {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
