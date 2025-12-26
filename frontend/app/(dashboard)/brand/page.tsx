"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandTable } from "@/components/BrandTable";
import { brandAPI } from "@/api/brand.api";
import { TargetBrandTable } from "@/components/target-brandTable";
import { Brand } from '../../../lib/models/brand.model';



export default function BrandPage() {
  const [brand_url, setBrand_url] = useState("");
  const [brand_name, setBrand_name] = useState("");
  const [actualBrandName, setActualBrandName] = useState("");
  const [brandType, setBrandType] = useState("");
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
      const res = await brandAPI.createTargetBrand({
        brand_name,
        official_url: brand_url,
        actual_brand_name: actualBrandName.trim() || undefined,
        brand_type: brandType.trim() || undefined,
      });
      toast.success("Target brand added!");
      setTargetBrands((prev) => [res.data, ...prev]);
      setBrand_name("");
      setBrand_url("");
      setActualBrandName("");
      setBrandType("");
    } catch (error) {
      toast.error("Failed to add brand.");
    }
  };
  return (
    <div className=" min-h-screen p-6 space-y-6">
      <div className="bg-white border-b rounded-2xl border-gray-200 sticky top-0 mt-3  z-10">
      <div className="px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Brand Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor your brand performance and AI insights
        </p>
      </div>
    </div>
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card min-w-full">
        <h2 className="text-xl font-bold">Add New Target Brand</h2>
        <form onSubmit={handleAddBrand} className="flex flex-col gap-3 ">
          <div className="flex flex-row gap-3">
            <Input 
              placeholder="Brand Name " 
              value={brand_name}
              onChange={(e) => setBrand_name(e.target.value)}
              required
            />
            <Input 
              placeholder="Official URL " 
              value={brand_url}
              onChange={(e) => setBrand_url(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-row gap-3">
            <Input 
              placeholder="Actual Brand Name" 
              value={actualBrandName}
              onChange={(e) => setActualBrandName(e.target.value)}
            />
            <Input 
              placeholder="Brand Type (e.g., Technology, Finance)" 
              value={brandType}
              onChange={(e) => setBrandType(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-fit">Add to Tracking</Button>
        </form>
      </div>

      <div className=" p-4 min-w-full border rounded-lg bg-card max-w-5xl">
        <TargetBrandTable data={targetBrands} loading={isLoading} onRefresh={loadBrands} />
      </div>
    </div>
  );
}
