import { brandAPI } from "@/api/brand.api"; // Use the structured API calls
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface BrandTableProps {
  data: any[];
  loading: boolean;
  onRefresh?: () => void; // Added to trigger UI updates
}

export function TargetBrandTable({ data, loading, onRefresh }: BrandTableProps) {
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});

  const handleToggleSchedule = async (id: string, isScheduled: boolean) => {
    setLoadingStates(prev => ({ ...prev, [id]: true }));
    try {
      if (isScheduled) {
        await brandAPI.scheduleStop(id);
        toast.success("Schedule stopped");
      } else {
        await brandAPI.scheduleRun(id);
        toast.success("Schedule started");
      }
      
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error("Failed to update schedule", error);
      toast.error("Failed to update schedule");
    } finally {
      setLoadingStates(prev => ({ ...prev, [id]: false }));
    }
  };

  if (loading) return <p className="p-4">Loading brands...</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Brand Name</TableHead>
          <TableHead>Official URL</TableHead>
          <TableHead>Added On</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((brand) => (
          <TableRow key={brand._id}>
            <TableCell className="font-medium">{brand.brand_name}</TableCell>
            <TableCell>
              <a 
                href={brand.official_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {brand.official_url}
              </a>
            </TableCell>
            <TableCell>{new Date(brand.createdAt).toLocaleString()}</TableCell>
            <TableCell className="text-right">
              <Button 
                onClick={() => handleToggleSchedule(brand._id, brand.isScheduled)}
                disabled={loadingStates[brand._id]}
                variant={brand.isScheduled ? "destructive" : "default"}
              >
                {loadingStates[brand._id] ? "Loading..." : brand.isScheduled ? "No" : "Yes"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}