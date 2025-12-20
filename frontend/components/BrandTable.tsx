import { PromptAPI } from "@/api/prompt.api";
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

export function BrandTable() {
  return (
    <Table>
      <TableCaption>Prompts</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Brand</TableHead>
          <TableHead>Visibility</TableHead>
          <TableHead>Sentiments</TableHead>
          <TableHead>Position</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {brandList.map((brand) => (
          <TableRow key={brand.brandName}>
            <TableCell className="font-medium">
              {brand.brandName}
            </TableCell>
            <TableCell>-</TableCell>
            <TableCell>-</TableCell>
            <TableCell>-</TableCell>
   
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
