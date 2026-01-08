import React from 'react'
import { ResponsiveContainer } from 'recharts'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Loader } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function WebTrafficChart(loading: boolean , chartData : any[],formatDate: (dateString: string) => string) {
  return (
 <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-5 ">
                    <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                      Website Traffic Trends
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500 font-medium">
                      Daily active users comparing Total vs AI traffic
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {loading ? (
                      <div className="flex items-center justify-center h-64">
                        <Loader className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#6b7280"
                            tick={{ fontSize: 12 }}
                            tickFormatter={formatDate}
                          />
                          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="users"
                            stroke="#1e40af"
                            strokeWidth={2}
                            name="Total Users"
                            dot={{ fill: "#1e40af", r: 2 }}
                            activeDot={{ r: 2 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="aiUsers"
                            stroke="#059669"
                            strokeWidth={2}
                            name="AI Traffic"
                            dot={{ fill: "#059669", r: 2 }}
                            activeDot={{ r: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
  )
}

export default WebTrafficChart