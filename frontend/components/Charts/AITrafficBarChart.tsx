"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Bar chart displaying total traffic/users from specific AI models (ChatGPT, Copilot, Perplexity) over the last 30 days.
 * Fetches data from the backend API.
 */
export function AITrafficBarChart() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrafficData() {
      try {
        // Fetch AI models traffic data from Google Analytics
        const response = await fetch("/api/audiences/ai-models-report")
        const result = await response.json()

        console.log("AI Models API Response:", result)

        // Transform GA data for Recharts
        // API returns: [{ model: "ChatGPT", users: 150, sessions: 200, ... }]
        const allowedModels = ["ChatGPT", "Copilot", "Perplexity"];
        const formatted = result
          .filter((item: any) => allowedModels.includes(item.model))
          .map((item: any) => ({
            model: item.model,
            traffic: item.users,
          })) || []

        console.log("Formatted data for chart:", formatted)
        setData(formatted)
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