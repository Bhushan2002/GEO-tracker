import { TooltipContent, TooltipTrigger, Tooltip as InfoTooltip } from "../../../../components/ui/tooltip";
import { Info, Loader, Table as TableIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../../components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../../../components/ui/table";

export default function AiModelPerformanceTable({
    loading,
    aiModelsData,
}: {
    loading: boolean;
    aiModelsData: any[];
}) {
    return (
        <div>

            <Card className="col-span-1 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100  px-5 ">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                AI Models Performance
                            </CardTitle>
                            <CardDescription className="text-[10px] text-slate-500 font-medium">
                                Detailed metrics for each AI model
                            </CardDescription>
                        </div>
                        <InfoTooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                            </TooltipTrigger>
                            <TooltipContent>
                                Detailed performance metrics including active
                                users, sessions, and conversion rates for each
                                AI model
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>AI Model</TableHead>
                                    <TableHead>Active Users</TableHead>
                                    <TableHead>Sessions</TableHead>
                                    <TableHead>Cv Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {aiModelsData.filter((row) => row.users > 0)
                                    .length > 0 ? (
                                    aiModelsData
                                        .filter((row) => row.users > 0)
                                        .map((row, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">
                                                    {row.model}
                                                </TableCell>
                                                <TableCell>{row.users || 0}</TableCell>
                                                <TableCell>
                                                    {row.sessions || 0}
                                                </TableCell>
                                                <TableCell>
                                                    {row.conversionRate || "0%"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="text-center text-muted-foreground py-8"
                                        >
                                            No AI model data available
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}