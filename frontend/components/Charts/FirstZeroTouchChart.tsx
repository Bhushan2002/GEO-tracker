import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, MousePointerClick } from "lucide-react";
/**
 * Line chart visualizing the first touch attribution data (New Users vs Conversions).
 */
export default function FirstZeroTouchChart({
  data,
  loading,
  formatDate,
}: {
  data: any;
  loading: boolean;
  formatDate: (dateStr: string) => string;
}) {
  return (
    <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-slate-100  px-5 ">
        <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
          First Touch Attribution
        </CardTitle>
        <CardDescription className="text-[10px] text-slate-500 font-medium">
          How user first discover your brand
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatDate}
                dy={10}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "none",
                  borderRadius: "6px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  padding: "12px",
                }}
                cursor={{
                  stroke: "#cbd5e1",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#2563eb"
                strokeWidth={3}
                name="New Users"
                dot={{
                  fill: "#2563eb",
                  r: 0,
                  strokeWidth: 0,
                  stroke: "#fff",
                }}
                activeDot={{ r: 4, strokeWidth: 0 }}
                fill="url(#colorUsers)"
              />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="#f59e0b"
                strokeWidth={3}
                name="Conversions"
                dot={{
                  fill: "#f59e0b",
                  r: 0,
                  strokeWidth: 0,
                  stroke: "#fff",
                }}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
            <MousePointerClick className="h-10 w-10 mb-3 opacity-20" />
            <p className="font-medium">No first touch data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
