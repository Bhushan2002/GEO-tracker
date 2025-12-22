import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; 

interface BrandTableProps {
  data: any[];
  loading: boolean;
}

export function TargetBrandTable({ data, loading }: BrandTableProps) {
  if (loading) return <p>Loading brands...</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Brand Name</TableHead>
          <TableHead>Official URL</TableHead>
          <TableHead>Added On</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center">No brands found.</TableCell>
          </TableRow>
        ) : (
          data.map((brand) => (
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
              <TableCell>
                {new Date(brand.createdAt).toLocaleString()} 
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}