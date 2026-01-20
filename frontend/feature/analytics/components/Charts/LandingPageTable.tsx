'use client'
import { cn } from "@/lib/utils";
import { TooltipContent, TooltipTrigger, Tooltip as InfoTooltip } from "../../../../components/ui/tooltip";
import { Info, Loader, Table as TableIcon } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../../components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";


interface AiLandingPageItem {
    page: string;
    source: string;
    users: number;
}

interface LandingPageTableProps {
    aiLandingPageData: AiLandingPageItem[];
    loading: boolean;
    limit: string;
    setLimit: (limit: string) => void;
}

export default function LandingPageTable({ aiLandingPageData, loading, limit, setLimit }: LandingPageTableProps) {
    return (
        <div>
            <Card className=" bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100  px-5 ">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                AI Traffic Landing pages
                            </CardTitle>
                            <CardDescription className="text-[10px] text-slate-500 font-medium">
                                Top pages where AI-referred user land
                            </CardDescription>
                        </div>
                        <InfoTooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                            </TooltipTrigger>
                            <TooltipContent>
                                Shows the top landing pages and entry points for
                                users coming from AI sources with their traffic
                                distribution
                            </TooltipContent>
                        </InfoTooltip>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                    ) : aiLandingPageData.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="text-sm font-medium text-gray-700">
                                    Total Pages:{" "}
                                    <span className="text-purple-600">
                                        {aiLandingPageData.length}
                                    </span>
                                </div>
                                <div className="text-sm font-medium text-gray-700">
                                    Total Users:{" "}
                                    <span className="text-purple-600">
                                        {aiLandingPageData.reduce(
                                            (sum: number, item) => sum + item.users,
                                            0
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        Rows:
                                    </span>
                                    <Select
                                        value={limit}
                                        onValueChange={(val) => setLimit(val)}
                                    >
                                        <SelectTrigger className="w-[70px] h-8 text-xs">
                                            <SelectValue placeholder="10" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div
                                className={cn(
                                    "border rounded-lg overflow-hidden",
                                    parseInt(limit) > 10 &&
                                    "max-h-[500px] overflow-y-auto"
                                )}
                            >
                                <Table>
                                    <TableHeader
                                        className={cn(
                                            "bg-purple-50",
                                            parseInt(limit) > 10 &&
                                            "sticky top-0 z-10 shadow-sm"
                                        )}
                                    >
                                        <TableRow className="bg-purple-50 hover:bg-purple-50">
                                            <TableHead className="font-semibold">
                                                #
                                            </TableHead>
                                            <TableHead className="font-semibold">
                                                Landing Page
                                            </TableHead>
                                            <TableHead className="font-semibold">
                                                Source
                                            </TableHead>
                                            <TableHead className="font-semibold text-right">
                                                Users
                                            </TableHead>
                                            <TableHead className="font-semibold text-right">
                                                Share
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {aiLandingPageData.map((item, index) => {
                                            const totalUsers = aiLandingPageData.reduce(
                                                (sum: number, i) => sum + i.users,
                                                0
                                            );
                                            const percentage = (
                                                (item.users / totalUsers) *
                                                100
                                            ).toFixed(1);

                                            return (
                                                <TableRow
                                                    key={index}
                                                    className="hover:bg-purple-50/50 transition-colors"
                                                >
                                                    <TableCell className="font-medium text-gray-600">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell className="max-w-md">
                                                        <div className="flex items-center gap-2">
                                                            <span className="truncate font-medium text-sm">
                                                                {item.page === "(not set)"
                                                                    ? "Homepage"
                                                                    : item.page}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {item.source}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="font-semibold text-gray-900">
                                                            {item.users}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-purple-600 h-2 rounded-full transition-all"
                                                                    style={{
                                                                        width: `${percentage}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-600 w-12 text-right">
                                                                {percentage}%
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[350px] text-gray-500">
                            <p className="text-lg font-medium">
                                No AI landing page data available
                            </p>
                            <p className="text-sm mt-2">
                                Check back later for AI traffic insights
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}