import { Request, Response } from "express";
import { ModelResponse } from "../models/modelResponse.model";

export const getModelResponses = async (req: Request, res: Response) => {
  try {
    const modelResponse = await ModelResponse.find();
    if (!modelResponse) {
      return res.status(404).json({ message: "Model Responses not found" });
    }
    res.status(200).json(modelResponse);
  } catch (err) {
    res.status(400).json({ message: "Error fetching model responses" });
  }
};
