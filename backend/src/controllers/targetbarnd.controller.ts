import { Request, Response } from "express";
import { TargetBrand } from "../models/targetBrand.model";
import { initScheduler } from "../services/cronSchedule";

export const createTargetBrand = async (req: Request, res: Response) => {
  try {
    const { brand_name, official_url } = req.body;
    
    const existing = await TargetBrand.findOne({ brand_name });
    if (existing) {
      return res.status(400).json({ message: "Target brand already exists" });
  }

    const newTarget = await TargetBrand.create({ brand_name, official_url });
    res.status(201).json(newTarget);
  } catch (e) {
    console.log(e)
  }
};

export const getTargetBrands = async (req: Request, res: Response) => {
  try {
    const targets = await TargetBrand.find();
    res.status(200).json(targets);
  } catch (e) {
    res.status(500).json({ message: "Error fetching target brands." });
  }
};

export const initializeBrandTask = async (req: Request, res: Response) => {
  try {
    await TargetBrand.findByIdAndUpdate(req.params.id, { isScheduled: true });
    await initScheduler(); // Refresh the cron tasks
    res.status(200).json({ message: "Brand added to daily schedule" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update brand schedule" });
  }
};

export const stopBrandTask = async (req: Request, res: Response) => {
  try {
    await TargetBrand.findByIdAndUpdate(req.params.id, { isScheduled: false });
    await initScheduler(); // Refresh the cron tasks
    res.status(200).json({ message: "Brand removed from daily schedule" });
  } catch (error) {
    res.status(500).json({ message: "Failed to stop brand schedule" });
  }
};