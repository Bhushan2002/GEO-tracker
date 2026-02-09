'use client'
import { Info, Loader } from "lucide-react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Bar, BarChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { TooltipContent, TooltipTrigger, Tooltip as InfoTooltip } from "../../../../components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

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
                        <div className="h-[300px] w-full flex items-end justify-between px-2 gap-4">
                            <Skeleton className="h-[60%] w-full rounded-t-md" />
                            <Skeleton className="h-[40%] w-full rounded-t-md" />
                            <Skeleton className="h-[80%] w-full rounded-t-md" />
                            <Skeleton className="h-[30%] w-full rounded-t-md" />
                            <Skeleton className="h-[50%] w-full rounded-t-md" />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={aiModelsData}
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