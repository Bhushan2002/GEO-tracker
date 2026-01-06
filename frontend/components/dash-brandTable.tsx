"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus, Loader } from "lucide-react";

export function DashBrandTable({ data = [], loading }: { data: any[], loading: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3 text-foreground/40">
        <Loader className="h-8 w-8 animate-spin text-foreground shrink-0" strokeWidth={2} />
        <p className="text-sm font-medium">Updating rankings...</p>
      </div>
    );
  }

  const getLogoUrl = (brand: any) => {
    if (brand.logo_url) return brand.logo_url;

    let domain = '';
    const name = (brand.brand_name || "").toLowerCase().trim();

    // 1. Try to extract from official URL if available
    if (brand.official_url) {
      try {
        domain = new URL(brand.official_url).hostname.replace('www.', '');
      } catch (e) { }
    }

    // 2. Specialized mappings for the pharmaceutical niche (Wegovy, Ozempic, etc.)
    const specialMappings: Record<string, string> = {
      'novo nordisk': 'novonordisk.com',
      'wegovy': 'wegovy.com',
      'ozempic': 'ozempic.com',
      'saxenda': 'saxenda.com',
      'eli lilly': 'lilly.com',
      'mounjaro': 'mounjaro.com'
    };

    if (!domain && specialMappings[name]) {
      domain = specialMappings[name];
    }

    // 3. Fallback: Guess .com domain
    if (!domain && name) {
      domain = name.replace(/\s+/g, '') + '.com';
    }

    return domain ? `https://logo.clearbit.com/${domain}` : null;
  };

  return (
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
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-12 text-slate-400 font-medium italic">
              No brand rankings currently available
            </TableCell>
          </TableRow>
        ) : (
          data.map((brand, index) => {
            const logoUrl = getLogoUrl(brand);
            return (
              <TableRow key={brand._id || index} className="hover:bg-slate-50/50 transition-all border-b border-slate-100 last:border-0 h-12 group">
                <TableCell className="text-center text-slate-400 text-xs font-bold border-r border-slate-100">
                  {index + 1}
                </TableCell>
                <TableCell className="border-r border-slate-100 pl-5">
                  <div className="flex items-center gap-3.5">
                    <div className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm overflow-hidden shrink-0 group-hover:scale-110 transition-transform duration-300">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={brand.brand_name}
                          className="h-5 w-5 object-contain"
                          loading="lazy"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            const parent = img.parentElement;
                            if (!parent) return;

                            if (img.src.includes('clearbit')) {
                              const name = (brand.brand_name || "").toLowerCase().trim().replace(/\s+/g, '');
                              img.src = `https://www.google.com/s2/favicons?domain=${name}.com&sz=128`;
                            } else {
                              img.style.display = 'none';
                              parent.classList.add('bg-slate-50');
                              const initial = (brand.brand_name || "?").charAt(0).toUpperCase();
                              if (!parent.querySelector('span')) {
                                const span = document.createElement('span');
                                span.className = "text-[12px] font-bold text-slate-400";
                                span.innerText = initial;
                                parent.appendChild(span);
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-50 flex items-center justify-center text-[12px] font-bold text-slate-400 uppercase">
                          {brand.brand_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="text-[13px] font-bold text-slate-800 truncate">{brand.brand_name}</span>
                  </div>
                </TableCell>

                <TableCell className="text-center border-r border-slate-100">
                  <span className="font-bold text-slate-900 text-[13px]">{brand.mentions || 0}%</span>
                </TableCell>

                <TableCell className="border-r border-slate-100">
                  <div className="flex justify-center">
                    <span className={cn(
                      "inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-bold border min-w-[36px]",
                      (brand.sentiment_score || 0) >= 60 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        (brand.sentiment_score || 0) >= 40 ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {brand.sentiment_score || 0}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <span className="font-bold text-slate-900 text-[13px]">{brand.lastRank || brand.rank || "-"}</span>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
