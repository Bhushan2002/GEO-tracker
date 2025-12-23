"use client";
import React, { useEffect, useState } from "react";
import { WebsiteTrafficChart } from "@/components/WebsiteTrafficChart";
import { toast } from "sonner";

export default function page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics");
        const result = await res.json();
        // Transform data for the chart
        const formatted = result.map((d: any) => ({
          name: d.name,
          users: d.users,
        }));
        setData(formatted);
      } catch (e) {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <h2 className="text-2xl font-bold">Website Traffic</h2>
      <div className="grid grid-cols-1 lg:col-span-12">
        {loading ? <p>Loading...</p> : <WebsiteTrafficChart data={data} />}
      </div>
    </div>
  );
}