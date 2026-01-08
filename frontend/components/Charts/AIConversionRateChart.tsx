"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function AIConversionRateChart({ data }: { data: any[] }) {
  const COLORS = ["#1e40af", "#059669", "#dc2626", "#8b5cf6", "#f59e0b"];

  return (
    <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-5 ">
        <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
          Conversion Rate by AI Model
        </CardTitle>
        <CardDescription className="text-[10px] text-slate-500 font-medium">
          Percentage of sessions that resulted in a key event
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="model" />
            <YAxis unit="%" />
            <Tooltip
              formatter={(value: number) => [`${value}%`, "Conversion Rate"]}
            />
            <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
