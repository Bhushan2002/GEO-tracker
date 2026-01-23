import { Card, CardContent } from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/api";
import { Users } from "lucide-react";

interface RealtimePropes {
  accountId: string;
}
function RealtimeBadge({ accountId }: RealtimePropes) {
  const [data, setData] = useState<{
    activeUsers: number;
    timeline: any[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRealtime = async () => {
    try {
      const res = await api.get(
        `/api/analytics/ai-overview-realtime?accountId=${accountId}`,
      );
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtime();
    const interval = setInterval(fetchRealtime, 60000);
    return () => clearInterval(interval);
  }, [accountId]);
  if (loading) return null;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className=" bg-card  rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
          <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
            AI Overview Clicks In Last 5 Minutes  
          </h3>
          <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </div>

        </div>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-slate-900">
            {data?.timeline?.map((item, i) => (
            <div
              key={i}
              className="w-1 bg-emerald-500/50 rounded-t-sm"
              style={{
                height: `${Math.max(10, Math.min(100, (item.count / (data.activeUsers || 1)) * 100))}%`,
                opacity: item.count > 0 ? 1 : 0.2,
              }}
            />
          ))}
          </div>
          <p className="text-xs text-slate-600/80 mt-1">
            Visits via "AI Overview" highlights
          </p>
        </CardContent>
      </Card>
      
    </div>
  );
}

export default RealtimeBadge;
