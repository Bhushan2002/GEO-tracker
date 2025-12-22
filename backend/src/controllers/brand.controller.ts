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
  