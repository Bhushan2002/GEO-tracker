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
        {/* Center Label - Rendered first to stay behind the chart and tooltip */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
          <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
            {totalCitations.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {label.toUpperCase()}
          </div>
        </div>

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
              paddingAngle={4}
              stroke="none"
              cornerRadius={4}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  strokeWidth={0}
                  className="outline-none hover:opacity-90 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const percent = Math.round((payload[0].value / totalCitations) * 100);
                  return (
                    <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-800 p-3 rounded-xl shadow-xl z-50 min-w-[160px]">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
                          <span className="text-[11px] font-bold text-neutral-100 uppercase tracking-tight">{payload[0].name}</span>
                        </div>
                        <span className="text-white font-mono text-xs font-bold">{percent}%</span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{payload[0].value.toLocaleString()}</div>
                      <div className="text-[10px] text-neutral-400 leading-tight">
                        Contribution to total sources across all detections.
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
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
