import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Brand } from "@/lib/models/brand.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";
import axios from "axios";
import {Vibrant} from 'node-vibrant/browser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const generateRandomColor = (brandName: string): string => {
  // Generate deterministic color based on brand name
  const hue = (brandName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 137.508) % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

const extractBrandColor = async (brandName: string): Promise<string> => {
  try {
    const domain = brandName.toLowerCase().replace(/\s+/g, '') + ".com";
    const logoUrl = `https://logo.clearbit.com/${domain}`;
    
    console.log(`Attempting to extract color for ${brandName} from ${logoUrl}`);
    
    const response = await axios.get(logoUrl, { 
      responseType: "arraybuffer", 
      timeout: 5000,
      validateStatus: (status) => status === 200
    });
    
    const buffer = Buffer.from(response.data);
    const palette = await Vibrant.from(buffer).getPalette();
    
    const swatch = palette.Vibrant || palette.DarkVibrant || palette.LightVibrant || palette.Muted;
    if (swatch) {
      console.log(`✓ Extracted color ${swatch.hex} for ${brandName}`);
      return swatch.hex;
    }

  } catch (error: any) { 
    console.log(`✗ No logo found for ${brandName}, using generated color`);
  }
  
  // Generate random color if extraction fails
  return generateRandomColor(brandName);
};

export async function GET(req: NextRequest) {
  try {
    await connectDatabase();
    
    const workspaceId = await getWorkspaceId(req);
    if (!workspaceId) return workspaceError();
    
    // First, let's see all brands
    const allBrands = await Brand.find({ workspaceId });
    console.log(`Total brands in workspace: ${allBrands.length}`);
    console.log('Sample brands:', allBrands.slice(0, 3).map(b => ({ name: b.brand_name, color: b.color })));
    
    const brands = await Brand.find({ 
      workspaceId,
      $or: [
        { color: { $exists: false } }, 
        { color: null },
        { color: "" }
      ] 
    });

    console.log(`Found ${brands.length} brands without colors in workspace ${workspaceId}`);

    let updatedCount = 0;
    const results = [];

    for (const brand of brands) {
      try {
        const newColor = await extractBrandColor(brand.brand_name);
        console.log(`Updating ${brand.brand_name} with color ${newColor}`);
        
        // Use findOneAndUpdate for atomic update
        const updated = await Brand.findOneAndUpdate(
          { _id: brand._id, workspaceId },
          { $set: { color: newColor } },
          { new: true }
        );
        
        if (updated) {
          updatedCount++;
          results.push({ brand: brand.brand_name, color: newColor, success: true });
          console.log(`✓ Successfully updated ${brand.brand_name} to ${newColor}`);
        } else {
          console.error(`Failed to update ${brand.brand_name} - not found`);
          results.push({ brand: brand.brand_name, success: false, error: 'Brand not found' });
        }
      } catch (err) {
        console.error(`Failed to update ${brand.brand_name}:`, err);
        results.push({ brand: brand.brand_name, success: false, error: String(err) });
      }
    }

    console.log(`✓ Successfully updated ${updatedCount} of ${brands.length} brands`);

    return NextResponse.json({ 
      message: "Sync complete", 
      updated: updatedCount, 
      totalProcessed: brands.length,
      results 
    });

  } catch (e) {
    console.error("Error syncing colors:", e);
    return NextResponse.json({ message: "Error syncing colors", error: String(e) }, { status: 500 });
  }
}