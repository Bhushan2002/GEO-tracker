import { cn } from "@/lib/utils";

interface BadgeByTypeProps {
  type: string;
  isUrl?: boolean;
}

export function BadgeByType({ type, isUrl }: BadgeByTypeProps) {
  const styles = {
    Competitor: "bg-red-50 text-red-600 border-red-100",
    You: "bg-green-50 text-green-600 border-green-100",
    Editorial: "bg-blue-50 text-blue-600 border-blue-100",
    Institutional: "bg-purple-50 text-purple-600 border-purple-100",
    Article: "bg-cyan-50 text-cyan-600 border-cyan-100",
    Comparison: "bg-indigo-50 text-indigo-600 border-indigo-100",
    "How-to Guide": "bg-emerald-50 text-emerald-600 border-emerald-100",
    Listicle: "bg-blue-50 text-blue-600 border-blue-100",
  } as any;

  const style = styles[type] || "bg-slate-50 text-slate-500 border-slate-200";

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded text-[11px] font-bold border",
        style
      )}
    >
      {type}
    </span>
  );
}
