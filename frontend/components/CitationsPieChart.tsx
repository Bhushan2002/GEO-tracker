"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
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
    <div className="w-full h-[400px] flex flex-col items-center justify-center">
      <div className="relative">
        <ResponsiveContainer width={400} height={400}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={90}
              paddingAngle={2}
              labelLine={true}
              label={({ name, percent }) =>
                `${name} ${!isNaN(percent) ? (percent * 100).toFixed(0) : 0}%`
              }

            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                `${value.toLocaleString()} citations`,
                "",
              ]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-4xl font-bold text-gray-900">
            {totalCitations.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">Citations</div>
        </div>
      </div>

      {/* Custom Legend */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 mb-6">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700 ">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
