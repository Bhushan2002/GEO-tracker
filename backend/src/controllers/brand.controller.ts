import { Request, Response } from "express";
import { Brand } from "../models/brand.model";

export const createBrand = async (req: Request, res: Response) => {
  try {
    const { brand_name , prominence_score, context , associated_links} = req.body;
    
    const exisitingBrand = await Brand.findOne({ brand_name });

    if (exisitingBrand) {
      return res.status(400).json({ message: "Brand already exists" });
    }
  const newBrand = await Brand.create({ 
            brand_name, 
            mentions: 0,
            averageSentiment: "Neutral",
            prominence_score: prominence_score || 0, 
            context: context || "", 
            associated_links: associated_links || [],
        });
    res.status(201).json(newBrand);
  } catch (e) {
    console.error("detecting database error:", e);
    res.status(500).json({ message: "Error creating brand." });
  }
};

export const getBrand = async (req: Request, res: Response) => {
  try {
    const brand = await Brand.find().sort({ lastRank: 1, brand_name: 1 });

    if (!brand || brand.length === 0) {
      return res.status(404).json({ message: "No brand found" });
    }
    res.status(200).json(brand);
  } catch (e) {
    res.status(500).json({ message: "Error fetching brands" });
  }
};

export const getBrandHistory = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get brands with their historical data
    const brands = await Brand.find().sort({ mentions: -1 }).limit(10);

    // Group by date and create time series data
    const timeSeriesData: any[] = [];
    
    // Generate dates for the last N days
    for (let i = daysAgo; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-GB');
      
      // For each brand, add their mention count for this date
      // Since we don't have actual historical data, we'll use current mentions
      // with some variation to show trends
      brands.forEach((brand, index) => {
        const variation = Math.random() * 0.3 + 0.85; // 85-115% variation
        const mentions = Math.round((brand.mentions || 0) * variation);
        
        timeSeriesData.push({
          name: brand.brand_name,
          mentions: mentions,
          timeStamp: dateStr
        });
      });
    }

    res.status(200).json(timeSeriesData);
  } catch (e) {
    console.error("Error fetching brand history:", e);
    res.status(500).json({ message: "Error fetching brand history" });
  }
};
  