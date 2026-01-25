import { Card, CardContent } from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/api";
import { Users } from "lucide-react";
import InfoButton from "@/components/InfoButton";
import { Skeleton } from "@/components/ui/skeleton";

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
    const interval = setInterval(fetchRealtime, 1800000); // Refresh every 30 minutes
    return () => clearInterval(interval);
  }, [accountId]);
  
  if (loading) {
    return (
      <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
          <Skeleton className="h-3 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
          </div>
        </div>
        <CardContent className="pt-6">
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
          <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
            AI Overview Clicks (Realtime)
          </h3>
          <div className="flex items-center gap-2">
            {/* <InfoButton content="Real-time AI Overview clicks from the last 30 minutes. Updates automatically to show live user engagement." /> */}
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
          </div>
        </div>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-slate-900">
            {data?.activeUsers || 0}
          </div>
          {/* <div className="flex items-end gap-1 h-12 mt-4">
            {data?.timeline?.map((item, i) => (
              <div
                key={i}
                className="flex-1 bg-emerald-500 rounded-t-sm transition-all"
                style={{
                  height: `${Math.max(10, Math.min(100, (item.count / (data.activeUsers || 1)) * 100))}%`,
                  opacity: item.count > 0 ? 1 : 0.2,
                }}
              />
            ))}
          </div> */}
          <p className="text-xs text-slate-600/80 mt-1">
            ai overview click events in the last 30 minutes
          </p>
        </CardContent>
      </Card>
  );
}

export default RealtimeBadge;
