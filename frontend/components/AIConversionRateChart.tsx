"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function AIConversionRateChart({ data }: { data: any[] }) {
  const COLORS = ['#1e40af', '#059669', '#dc2626', '#8b5cf6', '#f59e0b'];

  return (
    <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
         <div className="flex flex-col gap-0.5">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">Conversion Rate by AI Model</h3>
            <p className="text-[10px] text-slate-500 font-medium">Percentage of sessions that resulted in a key event</p>
         </div>
      </div>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="model" />
            <YAxis unit="%" />
            <Tooltip formatter={(value: number) => [`${value}%`, 'Conversion Rate']} />
            <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}