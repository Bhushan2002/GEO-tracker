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

interface BrandTableProps {
  data: any[];
  loading: boolean;
  onRefresh?: () => void; // Added to trigger UI updates
}

export function TargetBrandTable({ data, loading, onRefresh }: BrandTableProps) {
  const handleToggleSchedule = async (id: string, isScheduled: boolean) => {
    try {
      if (isScheduled) {
        await brandAPI.scheduleStop(id); // Use structured API call
        toast.success("Schedule stopped");
      } else {
        await brandAPI.scheduleRun(id); // Use structured API call
        toast.success("Schedule started");
      }
      
      if (onRefresh) onRefresh(); // Refresh the list to show updated status
    } catch (error) {
      console.error("Failed to update schedule", error);
      toast.error("Failed to update schedule");
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
            <TableCell>{/* link logic */}</TableCell>
            <TableCell>{new Date(brand.createdAt).toLocaleString()}</TableCell>
            <TableCell className="text-right">
              <Button onClick={() => handleToggleSchedule(brand._id, brand.isScheduled)}>
                {brand.isScheduled ? "Stop Schedule" : "Run Schedule"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}