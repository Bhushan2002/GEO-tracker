'use client'
import { Info, Loader } from "lucide-react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Bar, BarChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { TooltipContent, TooltipTrigger, Tooltip as InfoTooltip } from "../ui/tooltip";

interface TrafficByModelProps {
    loading: boolean;
    aiModelsData: any[];
}


export function TrafficByModel({ loading, aiModelsData }: TrafficByModelProps) {
    return (
        <div>
            <Card className="col-span-1 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100  px-5 ">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                Traffic by AI model
                            </CardTitle>
                            <CardDescription className="text-[10px] text-slate-500 font-medium">
                                Users from AI sources
                            </CardDescription>
                        </div>
                        <InfoTooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                            </TooltipTrigger>
                            <TooltipContent>
                                Bar chart showing the number of active users
                                coming from each AI model over the last 30 days
                            </TooltipContent>
                        </InfoTooltip>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={aiModelsData.filter(
                                    (item) => item.users > 0
                                )}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                />
                                <XAxis
                                    dataKey="model"
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="users" fill="#1e40af" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}