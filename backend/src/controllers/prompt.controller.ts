import { Request, Response } from "express";
import { Prompt } from "../models/prompt.model";
import { ModelResponse } from "../models/modelResponse.model";

export const createPromprt = async (req: Request, res: Response) => {
  try {
    const { promptText, topic, tags, ipAddress, schedule } = req.body;

    const prompt = await Prompt.create({
      promptText,
      topic,
      tags,
      ipAddress,
      schedule,
      isActive: true,
    });
    res.status(201).json(prompt);
  } catch (err) {
    res.status(400).json({ message: "Error creating prompt" });
  }
};

