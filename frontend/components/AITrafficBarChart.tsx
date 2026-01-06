"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DUMMY_TRAFFIC_DATA } from "@/lib/dummy-data"

export function AITrafficBarChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrafficData() {
      try {
        // SKIP API: const response = await fetch("/api/audiences/ai-models-report")
        // SKIP API: const result = await response.json()
        const result = DUMMY_TRAFFIC_DATA;

        console.log("Using Dummy AI Models Data:", result)

        setData(result)
      } catch (error) {
        console.error("Failed to fetch GA traffic:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchTrafficData()
  }, [])

  if (loading) return <div className="h-[300px] flex items-center justify-center">Loading Analytics...</div>

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Traffic by AI Model</CardTitle>
          <CardDescription>Total users coming from AI sources (Last 30 Days)</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-gray-500">
          No AI traffic data available yet
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Traffic by AI Model</CardTitle>
        <CardDescription>Total users coming from AI sources (Last 30 Days)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="model"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="traffic"
              fill="#1e40af"
              radius={[4, 4, 0, 0]}
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}