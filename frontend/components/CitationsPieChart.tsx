"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const CITATION_COLORS: Record<string, string> = {
  Competitor: "#EF4444", // red
  You: "#10B981", // green
  UGC: "#06B6D4", // cyan
  Editorial: "#3B82F6", // blue
  Corporate: "#F97316", // orange
  Reference: "#8B5CF6", // purple
  Other: "#6B7280", // gray
  Institutional: "#84CC16", // lime
};

type CitationData = {
  name: string;
  value: number;
  color: string;
};

interface Props {
  data: CitationData[];
  totalCitations: number;
  label?: string;
}

export default function CitationsPieChart({ data, totalCitations, label = "Total Sources" }: Props) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="relative w-full h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={2}
              stroke="none"
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="outline-none hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-slate-200 rounded-lg shadow-xl p-2.5 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
                        <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">{payload[0].name}</span>
                      </div>
                      <div className="text-lg font-bold text-slate-900">{payload[0].value.toLocaleString()}</div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
            {totalCitations.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {label}
          </div>
        </div>
      </div>

      {/* Custom Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-8 w-full">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5 group cursor-default">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-900 transition-colors uppercase tracking-tight">
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
