"use client";

import * as React from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SentimentChartProp {
  data: any[];
}

const BRAND_COLORS = [
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#f97316", // orange
  "#10b981", // green
  "#06b6d4", // cyan
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#ef4444", // red
  "#14b8a6", // teal
];

export function SentimentChart({ data }: SentimentChartProp) {
  const { chartData, top5Brands, hasData } = React.useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], top5Brands: [], hasData: false };
    
    // Check if the data has sentiment_score field
    const hasRequiredField = data.some(row => row.sentiment_score !== undefined && row.sentiment_score !== null);
    
    if (!hasRequiredField) {
      return { chartData: [], top5Brands: [], hasData: false };
    }
    
    // Calculate average sentiment scores for each brand
    const brandData: { [key: string]: { sum: number; count: number; dataPoints: any[] } } = {};
    
    data.forEach(row => {
      const brandName = row.name;
      const sentiment = parseFloat(row.sentiment_score) || 0;
      
      if (!brandData[brandName]) {
        brandData[brandName] = { sum: 0, count: 0, dataPoints: [] };
      }
      
      brandData[brandName].sum += sentiment;
      brandData[brandName].count += 1;
      brandData[brandName].dataPoints.push({
        timeStamp: row.timeStamp,
        sentiment: sentiment
      });
    });
    
    // Get top 5 brands by average sentiment
    const top5 = Object.entries(brandData)
      .map(([brand, stats]) => ({
        brand,
        avgSentiment: stats.sum / stats.count
      }))
      .sort((a, b) => b.avgSentiment - a.avgSentiment)
      .slice(0, 5)
      .map(item => item.brand);
    
    // Group data by timestamp
    const timeStampMap: { [key: string]: any } = {};
    Object.entries(brandData).forEach(([brandName, stats]) => {
      if (top5.includes(brandName)) {
        stats.dataPoints.forEach(point => {
          if (!timeStampMap[point.timeStamp]) {
            timeStampMap[point.timeStamp] = { timeStamp: point.timeStamp };
          }
          timeStampMap[point.timeStamp][brandName] = point.sentiment;
        });
      }
    });
    
    // Convert to array and sort by timestamp
    const transformed = Object.values(timeStampMap).sort((a, b) => {
      const dateA = new Date(a.timeStamp.split('/').reverse().join('-'));
      const dateB = new Date(b.timeStamp.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });
    
    return { chartData: transformed, top5Brands: top5, hasData: true };
  }, [data]);

  if (!hasData || !chartData || chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Brand Sentiment Trends</CardTitle>
          <CardDescription>Top 5 brands by sentiment scores over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px] text-gray-500">
            No sentiment data available in the current dataset
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Brand Sentiment Trends</CardTitle>
        <CardDescription>Top 5 brands by sentiment scores over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={chartData}
            margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.5}
            />
            <XAxis
              dataKey="timeStamp"
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              tickMargin={12}
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickMargin={8}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
            />

            {/* Lines for top 5 brands */}
            {top5Brands.map((brandName, index) => (
              <Line
                key={brandName}
                type="monotone"
                dataKey={brandName}
                stroke={BRAND_COLORS[index % BRAND_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 6 }}
                name={brandName}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
