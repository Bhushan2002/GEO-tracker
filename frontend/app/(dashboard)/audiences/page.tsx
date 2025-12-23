"use client";
import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { analyticsAPI } from "@/api/analytics.api";
import { toast } from "sonner";

export default function AudiencesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await analyticsAPI.getAudienceReport();
      setData(res.data);
    } catch (error) {
      toast.error("Failed to load audience analysis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Audience Intelligence</h1>
        <button 
          onClick={() => analyticsAPI.setupAiAudiences({})}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
        >
 
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Audience Name</TableHead>
              <TableHead>Active Users</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Conversions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{row.audience}</TableCell>
                <TableCell>{row.users}</TableCell>
                <TableCell>{row.sessions}</TableCell>
                <TableCell className="text-green-600">{row.conversions}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}