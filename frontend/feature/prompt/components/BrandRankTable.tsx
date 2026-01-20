'use client'
import { Card } from "@/components/ui/card";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";


export default function BrandRankTable({ brands }: { brands: any[] }) {
    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px] p-0 gap-0">
            <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                <div className="flex flex-col gap-0.5">
                    <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Layers className="h-3 w-3 text-slate-400" />
                        Brand Performance
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">Comparative metrics for detected brands</p>
                </div>
            </div>
            <div className="flex-1 overflow-auto bg-white">
                <Table className="border-collapse">
                    <TableHeader className="bg-white">
                        <TableRow className="hover:bg-transparent border-b border-slate-200">
                            <TableHead className="w-12 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-100 py-2.5">#</TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-5 border-r border-slate-100 py-2.5">Brand</TableHead>
                            <TableHead className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[18%] border-r border-slate-100 py-2.5">Visibility</TableHead>
                            <TableHead className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[18%] border-r border-slate-100 py-2.5">Sentiment</TableHead>
                            <TableHead className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[18%] py-2.5">Position</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {brands.map((brand: any, idx: number) => {
                            const logoUrl = `https://www.google.com/s2/favicons?domain=${brand.brand_name.toLowerCase().replace(/\s+/g, '')}.com&sz=128`;
                            return (
                                <TableRow key={idx} className="hover:bg-slate-50/50 transition-all border-b border-slate-100 last:border-0 h-12 group">
                                    <TableCell className="text-center text-slate-400 text-xs font-bold border-r border-slate-100">
                                        {idx + 1}
                                    </TableCell>
                                    <TableCell className="border-r border-slate-100 pl-5">
                                        <div className="flex items-center gap-3.5">
                                            <div className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm overflow-hidden shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                <img
                                                    src={logoUrl}
                                                    alt=""
                                                    className="h-5 w-5 object-contain"
                                                    onError={(e) => {
                                                        (e.target as any).src = `https://ui-avatars.com/api/?name=${brand.brand_name}&background=f8fafc&color=cbd5e1&font-size=0.5`;
                                                    }}
                                                />
                                            </div>
                                            <span className="text-[13px] font-bold text-slate-800 truncate">{brand.brand_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center border-r border-slate-100">
                                        <span className="font-bold text-slate-900 text-[13px]">{brand.visibility}%</span>
                                    </TableCell>
                                    <TableCell className="border-r border-slate-100">
                                        <div className="flex justify-center">
                                            {(() => {
                                                const raw = brand.sentiment || 0;
                                                const score = raw <= 10 ? raw * 10 : raw;
                                                return (
                                                    <span className={cn(
                                                        "inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-bold border min-w-[36px]",
                                                        score >= 60 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                            score >= 40 ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                                "bg-rose-50 text-rose-600 border-rose-100"
                                                    )}>
                                                        {score.toFixed(1)}%
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="font-bold text-slate-900 text-[13px]">{brand.position}</span>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}