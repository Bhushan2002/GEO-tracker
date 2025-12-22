'use client'
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
    <div style={{ width: "100%", height: 300 }}>
      <div className="px-4">
        <span className="font-bold">Top 5 Brands by Visibility</span>
      </div>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
