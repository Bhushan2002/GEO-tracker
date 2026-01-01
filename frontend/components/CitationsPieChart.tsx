"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
}

export default function CitationsPieChart({ data, totalCitations }: Props) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="relative w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={95}
              paddingAngle={4}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} className="outline-none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                `${value.toLocaleString()}`,
                "Sources",
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-3xl font-bold text-foreground">
            {totalCitations.toLocaleString()}
          </div>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
            Total Sources
          </div>
        </div>
      </div>

      {/* Custom Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mt-6 w-full max-w-[320px]">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-2.5 group cursor-default">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs font-medium text-gray-600 group-hover:text-foreground transition-colors truncate">
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
