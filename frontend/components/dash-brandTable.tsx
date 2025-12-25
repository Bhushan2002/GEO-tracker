
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export function DashBrandTable({ data = [], loading }: { data: any[], loading: boolean }) {
  if (loading) return <div>Loading brands...</div>;
  return (
    <Table >
      <TableHeader>
        <TableRow >
          <TableHead>Brand Name</TableHead>
          <TableHead>Mentions</TableHead>
          <TableHead>Last Sentiment</TableHead>
          <TableHead>Current Rank</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center">No brands tracked yet.</TableCell>
          </TableRow>
        ) : (
          data.map((brand) => (
            <TableRow key={brand._id}>
              <TableCell className="font-medium">{brand.brand_name}</TableCell>
              <TableCell>{brand.mentions || 0}</TableCell>
              <TableCell>{brand.averageSentiment || "N/A"}</TableCell>
              <TableCell>{brand.lastRank || "Unranked"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}