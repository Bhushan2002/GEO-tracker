import { PromptAPI } from "@/lib/api/prompt.api";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const brandList = [
  {
    brandName: "HSBC",
    visibility: 10,
    sentiment: 4,
    position: 3.1,
  },
  {
    brandName: "paypal",
    visibility: 10,
    sentiment: 5,
    position: 3.3,
  },
  {
    brandName: "Nvdia",
    visibility: 60,
    sentiment: 4,
    position: 1.1,
  },
  {
    brandName: "Wise",
    visibility: 42,
    sentiment: 4,
    position: 2.1,
  },
];

export function BrandTable({ data = [], loading }: { data: any[], loading: boolean }) {
  if (loading) return <div>Loading brands...</div>;
  return (
    <Table>
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
              <TableCell>
                {(() => {
                  const raw = brand.averageSentiment || 0;
                  const score = raw <= 10 ? raw * 10 : raw;
                  return score.toFixed(1) + "%";
                })()}
              </TableCell>
              <TableCell>{brand.lastRank || "Unranked"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}