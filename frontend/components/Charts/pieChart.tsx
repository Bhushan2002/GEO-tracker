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
    <div className="w-full h-[400px] flex flex-col items-center justify-center">
      <ResponsiveContainer>
        <PieChart className="flex flex-row">
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            paddingAngle={2}
            innerRadius={80}
            outerRadius={90}
            label={({ name, percent }) =>
              `${name} ${!isNaN(percent) ? (percent * 100).toFixed(0) : 0}%`
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
