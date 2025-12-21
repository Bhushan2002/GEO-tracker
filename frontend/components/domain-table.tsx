"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SourceType = "UGC" | "You" | "Reference" | "Competitor" | "Editorial";

interface Source {
  domain: string;
  type: SourceType;
  used: number;
}

const data: Source[] = [
  { domain: "reddit.com", type: "UGC", used: 32 },
  { domain: "attio.com", type: "You", used: 43 },
  { domain: "wikipedia.org", type: "Reference", used: 31 },
  { domain: "hubspot.com", type: "Competitor", used: 39 },
];

export default function DomainTable() {
  return (
    <div className="felx flex-col justify-center rounded-xl border bg-background p-4 space-y-4 h-100 w-120 items-center">
      
      <span className="font-medium text-gray-800  ">Domains</span>
      <hr className="mt-2 mb-0" />

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Domain</TableHead>
            <TableHead className="text-right">Used</TableHead>

          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((row) => (
            <TableRow key={row.domain}>
              <TableCell className="font-medium">{row.domain}</TableCell>

              <TableCell className="text-right">{row.used}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
