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
        <TableRow className="border-b border-border">
          <TableHead className="w-12 text-center text-xs font-semibold text-muted-foreground uppercase py-1.5 border-r border-border/50">#</TableHead>
          <TableHead className="text-xs font-semibold text-muted-foreground uppercase py-1.5 pl-4 border-r border-border/50">Brand</TableHead>
          <TableHead className="text-center text-xs font-semibold text-muted-foreground uppercase py-1.5 w-[15%] border-r border-border/50">Visibility</TableHead>
          <TableHead className="text-center text-xs font-semibold text-muted-foreground uppercase py-1.5 w-[15%] border-r border-border/50">Sentiment</TableHead>
          <TableHead className="text-center text-xs font-semibold text-muted-foreground uppercase py-1.5 w-[15%]">Position</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
              No brands tracked yet.
            </TableCell>
          </TableRow>
        ) : (
          data.map((brand, index) => {
            const logoUrl = getLogoUrl(brand);
            return (
              <TableRow key={brand._id || index} className="hover:bg-muted/80 transition-colors border-b border-border/50 group">
                <TableCell className="text-center text-muted-foreground text-xs font-medium py-1 border-r border-border/50">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium text-foreground py-1 pl-4 border-r border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg border border-border/80 flex items-center justify-center bg-white shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-200">
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

                            // If clearbit fails, try Google Favicon as a 2nd attempt
                            if (img.src.includes('clearbit')) {
                              const name = (brand.brand_name || "").toLowerCase().trim().replace(/\s+/g, '');
                              img.src = `https://www.google.com/s2/favicons?domain=${name}.com&sz=128`;
                            } else {
                              // If Google also fails, fallback to initials
                              img.style.display = 'none';
                              parent.classList.add('bg-muted/50');
                              const initial = (brand.brand_name || "?").charAt(0).toUpperCase();
                              if (!parent.querySelector('span')) {
                                const span = document.createElement('span');
                                span.className = "text-[12px] font-bold text-muted-foreground";
                                span.innerText = initial;
                                parent.appendChild(span);
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="h-full w-full bg-muted/30 flex items-center justify-center text-[11px] font-bold text-muted-foreground uppercase">
                          {brand.brand_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 truncate">{brand.brand_name}</span>
                  </div>
                </TableCell>

                <TableCell className="text-center py-1 border-r border-border/50">
                  <span className="font-bold text-foreground text-sm">{brand.mentions || 0}%</span>
                </TableCell>

                <TableCell className="py-1 border-r border-border/50">
                  <div className="flex justify-center">
                    <span className={cn(
                      "inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-semibold",
                      (brand.sentiment_score || 0) >= 60 ? "bg-green-50 text-green-700 border border-green-200" :
                        (brand.sentiment_score || 0) >= 40 ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
                          "bg-red-50 text-red-700 border border-red-200"
                    )}>
                      {brand.sentiment_score || 0}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-center py-1">
                  <span className="font-medium text-foreground text-sm">{brand.lastRank || "-"}</span>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
