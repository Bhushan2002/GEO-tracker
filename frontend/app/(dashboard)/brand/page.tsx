"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandTable } from "@/components/BrandTable";
import { brandAPI } from "@/api/brand.api";
import { TargetBrandTable } from "@/components/target-brandTable";



export default function BrandPage() {
  const [brand_url, setBrand_url] = useState("");
  const [brand_name, setBrand_name] = useState("");
  const [brands, setBrands] = useState<any[]>([]);
  const [targetBrands, setTargetBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  
  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const res = await brandAPI.getTargetBrand();
      setTargetBrands(res.data);
    } catch (error) {
      toast.error("Failed to load brands.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand_name.trim() || !brand_url.trim()) {
      return toast.error("Please provide both name and URL");
    }

    try {
      const res = await brandAPI.createTargetBrand(brand_name, brand_url);
      toast.success("Target brand added!");
      setTargetBrands((prev) => [res.data, ...prev]);
      setBrand_name("");
      setBrand_url("");
    } catch (error) {
      toast.error("Failed to add brand.");
    }
  };
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card w-300">
        <h2 className="text-xl font-bold">Add New Target Brand</h2>
        <form onSubmit={handleAddBrand} className="flex flex-row gap-3">
          <Input 
            placeholder="Brand Name (e.g., Nike)" 
            value={brand_name}
            onChange={(e) => setBrand_name(e.target.value)}
          />
          <Input 
            placeholder="Official URL (e.g., https://nike.com)" 
            value={brand_url}
            onChange={(e) => setBrand_url(e.target.value)}
          />
          <Button type="submit" className="w-fit">Add to Tracking</Button>
        </form>
      </div>

      <div className="border rounded-lg p-4 max-w-2xl">
        <h2 className="text-xl font-bold mb-4 ">Tracked Brands</h2>

        <TargetBrandTable data={targetBrands} loading={isLoading} onRefresh={loadBrands} />
      </div>
    </div>
  );
}
