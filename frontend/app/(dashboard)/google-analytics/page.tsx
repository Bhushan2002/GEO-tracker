"use client";
import React, { useEffect, useState } from "react";
import { WebsiteTrafficChart } from "@/components/WebsiteTrafficChart";
import { toast } from "sonner";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analyticsAPI } from "@/api/analytics.api";




interface Audience {
  name: string;
  displayName: string;
  description: string;
  membershipDurationDays: number;
  createdAt: { seconds: string; nanos: number } | string;
}


export default function page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    description: "",
    membershipDurationDays: 30,
    dimensionName: "firstUserSource",
    matchType: "EXACT",
    value: "chatgpt.com"
  });

  const loadAudiences = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.listAudiences();
      setAudiences(res.data);
    } catch (error) {
      toast.error("Failed to load audiences.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAudience = async () => {
    if (!formData.displayName || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await analyticsAPI.setupAiAudiences(formData);
      toast.success("Audience created successfully!");
      setIsDialogOpen(false);
      setFormData({
        displayName: "",
        description: "",
        membershipDurationDays: 30,
        dimensionName: "firstUserSource",
        matchType: "EXACT",
        value: "chatgpt.com"
      });
      loadAudiences();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create audience");
    }
  };

  useEffect(() => { loadAudiences(); }, []);

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    if (typeof date === "string") return new Date(date).toLocaleDateString();
    if (date.seconds) return new Date(parseInt(date.seconds) * 1000).toLocaleDateString();
    return "N/A";
  };


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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Audience Intelligence</h1>
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Create New Audience
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Create AI Audience</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Display Name *</label>
                <Input 
                  placeholder="e.g., First Touch AI Traffic"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description *</label>
                <Input 
                  placeholder="Describe your audience"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Membership Duration (Days)</label>
                <Input 
                  type="number"
                  value={formData.membershipDurationDays}
                  onChange={(e) => setFormData({...formData, membershipDurationDays: parseInt(e.target.value)})}
                />
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Filter Criteria</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Dimension</label>
                    <Select value={formData.dimensionName} onValueChange={(v) => setFormData({...formData, dimensionName: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="firstUserSource">First User Source</SelectItem>
                        <SelectItem value="sessionSource">Session Source</SelectItem>
                        <SelectItem value="pagePath">Page Path</SelectItem>
                        <SelectItem value="deviceCategory">Device Category</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Match Type</label>
                    <Select value={formData.matchType} onValueChange={(v) => setFormData({...formData, matchType: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXACT">Exact</SelectItem>
                        <SelectItem value="CONTAINS">Contains</SelectItem>
                        <SelectItem value="BEGINS_WITH">Begins With</SelectItem>
                        <SelectItem value="ENDS_WITH">Ends With</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Value</label>
                    <Input 
                      placeholder="e.g., chatgpt.com"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button onClick={handleCreateAudience} className="bg-blue-600 hover:bg-blue-700">
                Create Audience
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="bg-white rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  Loading audiences...
                </TableCell>
              </TableRow>
            ) : audiences.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                  No audiences found. Click "Initialize AI Audiences" to create one.
                </TableCell>
              </TableRow>
            ) : (
              audiences.map((audience, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{audience.displayName}</TableCell>
                  <TableCell>{audience.description || "N/A"}</TableCell>
                  <TableCell>{formatDate(audience.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}