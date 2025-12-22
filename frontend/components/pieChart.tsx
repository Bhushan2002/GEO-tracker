"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

type PieData = {
  name: string;
  value: number;
};

interface Props {
  data: PieData[];
}

export default function CustomPieChart({ data }: Props) {
  return (
    <div style={{ width: "100%", height: 350 }}>
      <div className="px-4 pb-5">
        <span className="font-medium text-gray-800">Competitive Share of Voice</span>
      </div>
      <ResponsiveContainer>
        <PieChart className="flex flex-row">
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
