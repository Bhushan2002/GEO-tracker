import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ChevronRight, Loader } from 'lucide-react';



/**
 * Displays a table of top domains used in AI responses.
 * Shows usage percentage, average citations, and source type.
 */
function DomainTable({ domainTableData, isLoading }: { domainTableData: any[], isLoading: boolean }) {
  return (
    <div className="xl:col-span-8 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex flex-col gap-0.5 min-w-[240px]">
          <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">Top Domains</h4>
          <p className="text-[10px] text-slate-500 font-medium">Displaying top 10 sources</p>
        </div>
        <div className="flex-1 flex items-center justify-end px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:flex">
          <span className="w-16 text-center">Used</span>
          <span className="w-28 text-center px-2">Avg. Citations</span>
          <span className="w-24 text-center">Type</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-foreground/40">
            <Loader className="h-8 w-8 animate-spin text-foreground shrink-0" strokeWidth={2} />
            <p className="text-sm font-medium">Fetching domain insights...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-700">
            {domainTableData.slice(0, 10).map((item: any, index: number) => (
              <div key={index} className="flex items-center h-12 px-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors text-sm group">
                <div className="flex items-center gap-3 min-w-[240px] border-r border-slate-50 h-full">
                  <div className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    <img
                      src={`https://logo.clearbit.com/${item.domain.replace(/^https?:\/\//, '').split('/')[0]}`}
                      alt={item.domain}
                      className="h-4 w-4 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const domain = item.domain.replace(/^https?:\/\//, '').split('/')[0];
                        if (!target.src.includes('google.com')) {
                          target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                        } else {
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.classList.add('bg-slate-50');
                            parent.innerHTML = `<span class="text-[9px] font-bold text-slate-400 capitalize">${item.domain.charAt(0)}</span>`;
                          }
                        }
                      }}
                    />
                  </div>
                  <span className="font-bold text-slate-800 truncate text-[13px]">{item.domain}</span>
                </div>

                <div className="flex-1 flex items-center justify-end px-4 h-full">
                  <div className="flex items-center hidden md:flex h-full">
                    <div className="w-16 text-center font-bold text-slate-900 text-[13px] border-r border-slate-50 h-full flex items-center justify-center">{item.used}%</div>
                    <div className="w-28 text-center text-slate-500 font-medium text-[13px] px-2 border-r border-slate-50 h-full flex items-center justify-center">{item.avgCitations}</div>
                    <div className="w-24 flex justify-center h-full flex items-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-bold border text-center min-w-[75px] capitalize",
                        item.type.toLowerCase() === 'competitor' ? "bg-rose-50 text-rose-600 border-rose-100" :
                          item.type.toLowerCase() === 'you' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            item.type.toLowerCase() === 'ugc' ? "bg-cyan-50 text-cyan-600 border-cyan-100" :
                              item.type.toLowerCase() === 'editorial' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                "bg-slate-50 text-slate-600 border-slate-100"
                      )}>
                        {item.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {domainTableData.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No domain data available
              </div>
            )}
          </div>
        )}
      </div>
      <div className="p-3 border-t border-slate-100 bg-slate-50/30 flex justify-end shrink-0">
        <Link href="/sources" className="text-[10px] font-bold uppercase text-slate-500 hover:text-slate-900 transition-all flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 rounded-md border border-slate-200 shadow-sm">
          Detailed Source Analytics <ChevronRight className="h-3 w-3" strokeWidth={3} />
        </Link>
      </div>
    </div>
  )
}

export default DomainTable