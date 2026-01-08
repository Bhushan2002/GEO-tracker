"use client";
import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { analyticsAPI } from "@/lib/api/analytics.api";
import { api } from "@/lib/api/api";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { Loader } from "lucide-react";

/**
 * Audiences page for analyzing user segments.
 * Allows setting up specific audiences for AI tools tracking.
 */
export default function AudiencesPage() {
  const { activeWorkspace } = useWorkspace();
  const [gaAccounts, setGaAccounts] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const loadGAAccounts = async () => {
    try {
      const res = await api.get("/api/ga-accounts");
      const accounts = res.data;
      setGaAccounts(accounts);

      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0]._id);
      } else {
        setSelectedAccountId("");
        setData([]);
      }
    } catch (error) {
      console.error("Failed to load GA accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (accountId: string) => {
    try {
      const res = await analyticsAPI.getAudienceReport(accountId);
      setData(res.data);
    } catch (error) {
      toast.error("Failed to load audience analysis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadGAAccounts();
  }, [activeWorkspace?._id]);

  useEffect(() => {
    if (selectedAccountId) {
      loadData(selectedAccountId);
    }
  }, [selectedAccountId]);

  if (loading) {
    return <div className="p-10 text-slate-400 animate-pulse font-medium">Loading analytics...</div>;
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 ease-out">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Audience Intelligence</h1>
          {gaAccounts.length > 0 && (
            <select
              title="Select GA Account"
              className="bg-white border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              {gaAccounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.accountName} ({acc.propertyId})
                </option>
              ))}
            </select>
          )}
        </div>
        {selectedAccountId && (
          <button
            onClick={async () => {
              try {
                await analyticsAPI.setupAiModelsAudience(selectedAccountId);
                toast.success("AI Tools audience created successfully!");
                loadData(selectedAccountId);
              } catch (err: any) {
                toast.error(err.response?.data?.error || "Failed to setup audience.");
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Setup AI Tools Audience
          </button>
        )}
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