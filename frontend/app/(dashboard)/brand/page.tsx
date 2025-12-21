"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandTable } from "@/components/BrandTable";
import { brandAPI } from "@/api/brand.api";

export default function BrandPage() {
  const [brand_name, setBrand_name] = useState("");
  const [brands, setBrands] = useState<any[]>([]); // Dynamic state for the list
  const [isLoading, setIsLoading] = useState(true);

  // Fetch brands on initial load
  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const res = await brandAPI.getBrands();
      setBrands(res.data);
    } catch (error) {
      toast.error("Failed to load brands.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand_name.trim()) return;

    try {
      const res = await brandAPI.createBrand(brand_name);
      toast.success("Brand added successfully!");
      

      setBrands((prev) => [res.data, ...prev]); 
      setBrand_name("");
    } catch (error) {
      toast.error("Failed to add brand or it already exists.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
        <h2 className="text-xl font-bold">Target Brands</h2>
        <form onSubmit={handleAddBrand} className="flex gap-2">
          <Input 
            placeholder="Enter brand name (e.g., Nike)" 
            value={brand_name}
            onChange={(e) => setBrand_name(e.target.value)}
            className="max-w-sm"
          />
          <Button type="submit">Add Brand</Button>
        </form>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Tracked Brands</h2>
        {/* Pass the dynamic brands array to the table component */}
        <BrandTable data={brands} loading={isLoading} />
      </div>
    </div>
  );
}