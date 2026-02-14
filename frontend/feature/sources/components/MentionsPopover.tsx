import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MentionsPopoverProps {
  mentions: string[];
  logoLookup?: Record<string, string>;
}

export function MentionsPopover({ mentions, logoLookup }: MentionsPopoverProps) {
  if (!mentions || mentions.length === 0)
    return <span className="text-slate-300">-</span>;

  const getBrandDomain = (brand: string) => {
    if (logoLookup && logoLookup[brand]) return logoLookup[brand];
    return `${brand.toLowerCase().replace(/\s+/g, "")}.com`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer group/mentions overflow-hidden justify-center bg-slate-50/50 hover:bg-white px-2 py-1 rounded-full border border-transparent hover:border-slate-200 transition-all w-fit mx-auto">
          <div className="flex -space-x-1.5 shrink-0">
            {mentions.slice(0, 2).map((brand, i) => {
              const domain = getBrandDomain(brand);
              return (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-white bg-white shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover/mentions:translate-x-0.5 first:group-hover/mentions:translate-x-0"
                >
                  <img
                    src={`https://logo.clearbit.com/${domain}`}
                    className="w-3 h-3 object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes("google.com")) {
                        target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                      } else {
                        target.style.display = "none";
                        target.parentElement!.innerHTML = `<span class="text-[8px] font-bold text-slate-400 capitalize">${brand.charAt(
                          0
                        )}</span>`;
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
          <span className="text-[10px] font-bold text-slate-700 truncate max-w-[70px] leading-none">
            {mentions[0]}
          </span>
          {mentions.length > 1 && (
            <span className="text-[9px] font-black text-slate-400 bg-white px-1 rounded-sm border border-slate-100 leading-none">
              +{mentions.length - 1}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0 bg-white border border-slate-200 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        align="center"
      >
        <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-900">
            Mentioned Brands
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
            {mentions.length}
          </span>
        </div>
        <div className="p-1 max-h-[240px] overflow-auto custom-scrollbar">
          {mentions.map((brand, i) => {
            const domain = getBrandDomain(brand);
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-lg transition-colors group cursor-default"
              >
                <div className="w-6 h-6 rounded-md border border-slate-100 flex items-center justify-center bg-white overflow-hidden shadow-sm">
                  <img
                    src={`https://logo.clearbit.com/${domain}`}
                    className="w-3.5 h-3.5 object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes("google.com")) {
                        target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                      } else {
                        target.style.display = "none";
                        target.parentElement!.innerHTML = `<span class="text-[8px] font-bold text-slate-400 capitalize">${brand.charAt(
                          0
                        )}</span>`;
                      }
                    }}
                  />
                </div>
                <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                  {brand}
                </span>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
